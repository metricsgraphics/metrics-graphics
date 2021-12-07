import AbstractChart, { IAbstractChart } from './abstractChart'
import Line from '../components/line'
import Area from '../components/area'
import constants from '../misc/constants'
import Delaunay, { IDelaunay } from '../components/delaunay'
import { makeAccessorFunction } from '../misc/utility'
import {
  AccessorFunction,
  LegendSymbol,
  InteractionFunction,
  EmptyInteractionFunction
} from '../misc/typings'
import { IPoint } from '../components/point'
import { TooltipSymbol } from '../components/tooltip'

type ConfidenceBand = [AccessorFunction | string, AccessorFunction | string]

export interface ILineChart extends IAbstractChart {
  /** specifies for which sub-array of data an area should be shown. Boolean if data is a simple array */
  area?: Array<any> | boolean

  /** array with two elements specifying how to access the lower (first) and upper (second) value for the confidence band. The two elements work like accessors and are either a string or a function */
  confidenceBand?: ConfidenceBand

  /** custom parameters passed to the voronoi generator */
  voronoi?: Partial<IDelaunay>

  /** function specifying whether or not to show a given datapoint */
  defined?: (point: any) => boolean

  /** accessor specifying for a given data point whether or not to show it as active */
  activeAccessor?: AccessorFunction | string

  /** custom parameters passed to the active point generator. See {@see Point} for a list of parameters */
  activePoint?: Partial<IPoint>
}

export default class LineChart extends AbstractChart {
  delaunay?: Delaunay
  defined?: (point: any) => boolean
  activeAccessor?: AccessorFunction
  activePoint?: Partial<IPoint>
  area?: Array<any> | boolean
  confidenceBand?: ConfidenceBand
  delaunayParams?: Partial<IDelaunay>

  // one delaunay point per line
  delaunayPoints: Array<any> = []

  constructor({
    area,
    confidenceBand,
    voronoi,
    defined,
    activeAccessor,
    activePoint,
    ...args
  }: ILineChart) {
    super(args)

    // if data is not a 2d array, die
    if (!Array.isArray(args.data[0]))
      throw new Error('data is not a 2-dimensional array.')

    if (defined) this.defined = defined
    if (activeAccessor)
      this.activeAccessor = makeAccessorFunction(activeAccessor)
    this.activePoint = activePoint ?? this.activePoint
    this.area = area ?? this.area
    this.confidenceBand = confidenceBand ?? this.confidenceBand
    this.delaunayParams = voronoi ?? this.delaunayParams

    this.redraw()
  }

  redraw(): void {
    this.mountLines()
    this.mountActivePoints(this.activePoint ?? {})

    // generate areas if necessary
    this.mountAreas(this.area || false)

    // set tooltip type
    if (this.tooltip) {
      this.tooltip.update({ legendObject: TooltipSymbol.LINE })
      this.tooltip.hide()
    }

    // generate confidence band if necessary
    if (this.confidenceBand) {
      this.mountConfidenceBand(this.confidenceBand)
    }

    // add markers and baselines
    this.mountMarkers()
    this.mountBaselines()

    // set up delaunay triangulation
    this.mountDelaunay(this.delaunayParams ?? {})

    // mount legend if any
    this.mountLegend(LegendSymbol.LINE)

    // mount brush if necessary
    this.mountBrush(this.brush)
  }

  /**
   * Mount lines for each array of data points.
   */
  mountLines(): void {
    // abort if container is not defined yet
    if (!this.container) {
      console.error('error: container is not defined yet')
      return
    }

    // compute lines and delaunay points
    this.data.forEach((lineData, index) => {
      const line = new Line({
        data: lineData,
        xAccessor: this.xAccessor,
        yAccessor: this.yAccessor,
        xScale: this.xScale,
        yScale: this.yScale,
        color: this.colors[index],
        defined: this.defined
      })
      this.delaunayPoints[index] = this.generatePoint({ radius: 3 })
      line.mountTo(this.container!)
    })
  }

  /**
   * If an active accessor is specified, mount active points.
   * @param params custom parameters for point generation. See {@see Point} for a list of options.
   */
  mountActivePoints(params: Partial<IPoint>): void {
    // abort if container is not defined yet
    if (!this.container) {
      console.error('error: container is not defined yet')
      return
    }

    if (!this.activeAccessor) return
    this.data.forEach((pointArray, index) => {
      pointArray.filter(this.activeAccessor).forEach((data: any) => {
        const point = this.generatePoint({
          data,
          color: this.colors[index],
          radius: 3,
          ...params
        })
        point.mountTo(this.container!)
      })
    })
  }

  /**
   * Mount all specified areas.
   *
   * @param area specifies for which sub-array of data an area should be shown. Boolean if data is a simple array.
   */
  mountAreas(area: Array<any> | boolean): void {
    if (typeof area === 'undefined') return

    let areas: Array<any> = []
    const areaGenerator = (lineData: any, index: number) =>
      new Area({
        data: lineData,
        xAccessor: this.xAccessor,
        yAccessor: this.yAccessor,
        xScale: this.xScale,
        yScale: this.yScale,
        color: this.colors[index],
        defined: this.defined
      })

    // if area is boolean and truthy, generate areas for each line
    if (typeof area === 'boolean' && area) {
      areas = this.data.map(areaGenerator)

      // if area is array, only show areas for the truthy lines
    } else if (Array.isArray(area)) {
      areas = this.data
        .filter((lineData, index) => area[index])
        .map(areaGenerator)
    }

    // mount areas
    areas.forEach((area) => area.mountTo(this.container))
  }

  /**
   * Mount the confidence band specified by two accessors.
   *
   * @param lowerAccessor for the lower confidence bound. Either a string (specifying the property of the object representing the lower bound) or a function (returning the lower bound when given a data point).
   * @param upperAccessor for the upper confidence bound. Either a string (specifying the property of the object representing the upper bound) or a function (returning the upper bound when given a data point).
   */
  mountConfidenceBand([lowerAccessor, upperAccessor]: ConfidenceBand): void {
    // abort if container is not set
    if (!this.container) {
      console.error('error: container not defined yet')
      return
    }

    const confidenceBandGenerator = new Area({
      data: this.data[0], // confidence band only makes sense for one line
      xAccessor: this.xAccessor,
      y0Accessor: makeAccessorFunction(lowerAccessor),
      yAccessor: makeAccessorFunction(upperAccessor),
      xScale: this.xScale,
      yScale: this.yScale,
      color: '#aaa'
    })
    confidenceBandGenerator.mountTo(this.container)
  }

  /**
   * Mount markers, if any.
   */
  mountMarkers(): void {
    // abort if content is not set yet
    if (!this.content) {
      console.error('error: content container not set yet')
      return
    }

    const markerContainer = this.content
      .append('g')
      .attr('transform', `translate(${this.left},${this.top})`)
    this.markers.forEach((marker) => {
      const x = this.xScale.scaleObject(this.xAccessor(marker))
      markerContainer
        .append('line')
        .classed('line-marker', true)
        .attr('x1', x!)
        .attr('x2', x!)
        .attr('y1', this.yScale.range[0] + this.buffer)
        .attr('y2', this.yScale.range[1] + this.buffer)
      markerContainer
        .append('text')
        .classed('text-marker', true)
        .attr('x', x!)
        .attr('y', 8)
        .text(marker.label)
    })
  }

  mountBaselines(): void {
    // abort if content is not set yet
    if (!this.content) {
      console.error('error: content container not set yet')
      return
    }

    const baselineContainer = this.content
      .append('g')
      .attr('transform', `translate(${this.left},${this.top})`)
    this.baselines.forEach((baseline) => {
      const y = this.yScale.scaleObject(this.yAccessor(baseline))
      baselineContainer
        .append('line')
        .classed('line-baseline', true)
        .attr('x1', this.xScale.range[0] + this.buffer)
        .attr('x2', this.xScale.range[1] + this.buffer)
        .attr('y1', y!)
        .attr('y2', y!)
      baselineContainer
        .append('text')
        .classed('text-baseline', true)
        .attr('x', this.xScale.range[1] + this.buffer)
        .attr('y', y! - 2)
        .text(baseline.label)
    })
  }

  /**
   * Handle incoming points from the delaunay move handler.
   *
   * @returns handler function.
   */
  onPointHandler(): InteractionFunction {
    return (points) => {
      // pre-hide all points
      this.delaunayPoints.forEach((dp) => dp.dismount())

      points.forEach((point) => {
        const index = point.arrayIndex || 0

        // set hover point
        this.delaunayPoints[index].update({
          data: point,
          color: this.colors[index]
        })
        this.delaunayPoints[index].mountTo(this.container)
      })

      // set tooltip if necessary
      if (!this.tooltip) return
      this.tooltip.update({ data: points })
    }
  }

  /**
   * Handles leaving the delaunay area.
   *
   * @returns handler function.
   */
  onLeaveHandler(): EmptyInteractionFunction {
    return () => {
      this.delaunayPoints.forEach((dp) => dp.dismount())
      if (this.tooltip) this.tooltip.hide()
    }
  }

  /**
   * Mount a new delaunay triangulation instance.
   *
   * @param customParameters custom parameters for {@link Delaunay}.
   */
  mountDelaunay(customParameters: Partial<IDelaunay>): void {
    // abort if container is not set yet
    if (!this.container) {
      console.error('error: container not set yet')
      return
    }

    this.delaunay = new Delaunay({
      points: this.data,
      xAccessor: this.xAccessor,
      yAccessor: this.yAccessor,
      xScale: this.xScale,
      yScale: this.yScale,
      onPoint: this.onPointHandler(),
      onLeave: this.onLeaveHandler(),
      defined: this.defined,
      ...customParameters
    })
    this.delaunay.mountTo(this.container)
  }

  computeYAxisType(): void {
    // abort if no y axis is used
    if (!this.yAxis) {
      console.error('error: no y axis set')
      return
    }

    const flatData = this.data.flat()
    const yValue = this.yAccessor(flatData[0])

    if (yValue instanceof Date) {
      this.yAxis.tickFormat = constants.axisFormat.date
    } else if (Number(yValue) === yValue) {
      this.yAxis.tickFormat = constants.axisFormat.number
    }
  }
}
