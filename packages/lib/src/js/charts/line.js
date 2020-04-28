import AbstractChart from './abstractChart'
import Line from '../components/line'
import Area from '../components/area'
import constants from '../misc/constants'
import Delaunay from '../components/delaunay'
import { makeAccessorFunction } from '../misc/utility'

/**
 * Creates a new line graph.
 *
 * @param {Object} args argument object. See {@link AbstractChart} for general parameters.
 * @param {Boolean | Array} [args.area=[]] specifies for which sub-array of data an area should be shown. Boolean if data is a simple array.
 * @param {Array} [args.confidenceBand] array with two elements specifying how to access the lower (first) and upper (second) value for the confidence band. The two elements work like accessors and are either a string or a function.
 * @param {Object} [args.voronoi] custom parameters passed to the voronoi generator.
 * @param {Function} [args.defined] optional function specifying whether or not to show a given data point.
 * @param {String | Function} [args.activeAccessor] accessor specifying for a given data point whether or not to show it as active.
 * @param {Object} [activePoint] custom parameters passed to the active point generator. See {@see Point} for a list of parameters.
 */
export default class LineChart extends AbstractChart {
  delaunay = null
  defined = null
  activeAccessor = null
  activePoint = null
  area = []
  confidenceBand = null
  delaunayParams = null

  // one delaunay point per line
  delaunayPoints = []

  constructor ({ area, confidenceBand, voronoi, defined = null, activeAccessor = null, activePoint, ...args }) {
    super(args)
    this.defined = defined ?? this.defined
    this.activeAccessor = activeAccessor ? makeAccessorFunction(activeAccessor) : this.activeAccessor
    this.activePoint = activePoint ?? this.activePoint
    this.area = area ?? this.area
    this.confidenceBand = confidenceBand ?? this.confidenceBand
    this.delaunayParams = voronoi ?? this.delaunayParams

    this.draw()
  }

  draw () {
    this.mountLines()
    this.mountActivePoints(this.activePoint)

    // generate areas if necessary
    this.mountAreas(this.area)

    // set tooltip type
    if (this.tooltip) {
      this.tooltip.update({ legendObject: constants.legendObject.line })
      this.tooltip.hide()
    }

    // generate confidence band if necessary
    if (this.confidenceBand) {
      this.mountConfidenceBand({
        lowerAccessor: this.confidenceBand[0],
        upperAccessor: this.confidenceBand[1]
      })
    }

    // add markers and baselines
    this.mountMarkers()
    this.mountBaselines()

    // set up delaunay triangulation
    this.mountDelaunay(this.delaunayParams)

    // mount legend if any
    this.mountLegend(constants.legendObject.line)

    // mount brush if necessary
    this.mountBrush(this.brush)
  }

  /**
   * Mount lines for each array of data points.
   * @returns {void}
   */
  mountLines () {
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
      line.mountTo(this.container)
    })
  }

  /**
   * If an active accessor is specified, mount active points.
   * @param {Object} [params] custom parameters for point generation. See {@see Point} for a list of options.
   * @returns {void}
   */
  mountActivePoints (params) {
    if (this.activeAccessor === null) return
    this.data.forEach((pointArray, index) => {
      pointArray.filter(this.activeAccessor).forEach(data => {
        const point = this.generatePoint({
          data,
          color: this.colors[index],
          radius: 3,
          ...params
        })
        point.mountTo(this.container)
      })
    })
  }

  /**
   * Mount all specified areas.
   *
   * @param {Boolean | Array} [area=[]] specifies for which sub-array of data an area should be shown. Boolean if data is a simple array.
   * @returns {void}
   */
  mountAreas (area) {
    if (typeof area === 'undefined') return

    let areas
    const areaGenerator = (lineData, index) => new Area({
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
      areas = this.data.filter((lineData, index) => area[index]).map(areaGenerator)
    }

    // mount areas
    areas.forEach(area => area.mountTo(this.container))
  }

  /**
   * Mount the confidence band specified by two accessors.
   *
   * @param {Function | String} lowerAccessor for the lower confidence bound. Either a string (specifying the property of the object representing the lower bound) or a function (returning the lower bound when given a data point).
   * @param {Function | String} upperAccessor for the upper confidence bound. Either a string (specifying the property of the object representing the upper bound) or a function (returning the upper bound when given a data point).
   * @returns {void}
   */
  mountConfidenceBand ({ lowerAccessor, upperAccessor }) {
    const confidenceBandGenerator = new Area({
      data: this.data[0], // confidence band only makes sense for one line
      xAccessor: this.xAccessor,
      y0Accessor: makeAccessorFunction(lowerAccessor),
      y1Accessor: makeAccessorFunction(upperAccessor),
      xScale: this.xScale,
      yScale: this.yScale,
      color: '#aaa'
    })
    confidenceBandGenerator.mountTo(this.container)
  }

  /**
   * Mount markers, if any.
   * @returns {void}
   */
  mountMarkers () {
    const markerContainer = this.content.append('g').attr('transform', `translate(${this.left},${this.top})`)
    this.markers.forEach(marker => {
      const x = this.xScale.scaleObject(this.xAccessor(marker))
      markerContainer
        .append('line')
        .classed('line-marker', true)
        .attr('x1', x)
        .attr('x2', x)
        .attr('y1', this.yScale.range[0] + this.buffer)
        .attr('y2', this.yScale.range[1] + this.buffer)
      markerContainer
        .append('text')
        .classed('text-marker', true)
        .attr('x', x)
        .attr('y', 8)
        .text(marker.label)
    })
  }

  mountBaselines () {
    const baselineContainer = this.content.append('g').attr('transform', `translate(${this.left},${this.top})`)
    this.baselines.forEach(baseline => {
      const y = this.yScale.scaleObject(this.yAccessor(baseline))
      baselineContainer
        .append('line')
        .classed('line-baseline', true)
        .attr('x1', this.xScale.range[0] + this.buffer)
        .attr('x2', this.xScale.range[1] + this.buffer)
        .attr('y1', y)
        .attr('y2', y)
      baselineContainer
        .append('text')
        .classed('text-baseline', true)
        .attr('x', this.xScale.range[1] + this.buffer)
        .attr('y', y - 2)
        .text(baseline.label)
    })
  }

  /**
   * Handle incoming points from the delaunay move handler.
   *
   * @returns {Function} handler function.
   */
  onPointHandler () {
    return points => {
      // pre-hide all points
      this.delaunayPoints.forEach(dp => dp.dismount())

      points.forEach(point => {
        const index = point.arrayIndex || 0

        // set hover point
        this.delaunayPoints[index].update({ data: point, color: this.colors[index] })
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
   * @returns {Function} handler function.
   */
  onLeaveHandler () {
    return () => {
      this.delaunayPoints.forEach(dp => dp.dismount())
      if (this.tooltip) this.tooltip.hide()
    }
  }

  /**
   * Mount a new delaunay triangulation instance.
   *
   * @param {Object} customParameters custom parameters for {@link Delaunay}.
   * @returns {void}
   */
  mountDelaunay (customParameters) {
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

  /**
   * Normalizes the passed data to a nested array of objects.
   *
   * isSingleObject: return error
   * isArrayOfObjects: nest once
   * isArrayOfArrays: do nothing
   * isNestedArrayOfArrays: do nothing, assume index-based accessor
   * isNestedArrayOfObjects: do nothing
   * @returns {void}
   */
  normalizeData () {
    if (this.isSingleObject) {
      throw new Error('error: line chart needs data in array format')
    }

    if (this.isArrayOfObjects) this.data = [this.data]
  }

  computeXAxisType () {
    const flatData = this.data.flat()
    const xValue = this.xAccessor(flatData[0])

    if (xValue instanceof Date) {
      this.xAxis.tickFormat = 'date'
    } else if (Number(xValue) === xValue) {
      this.xAxis.tickFormat = 'number'
    }
  }

  computeYAxisType () {
    const flatData = this.data.flat()
    const yValue = this.yAccessor(flatData[0])

    if (yValue instanceof Date) {
      this.yAxis.tickFormat = constants.axisFormat.date
    } else if (Number(yValue) === yValue) {
      this.yAxis.tickFormat = constants.axisFormat.number
    }
  }
}
