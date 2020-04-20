import AbstractChart from './abstractChart'
import { extent } from 'd3-array'
import Line from '../components/line'
import Area from '../components/area'
import constants from '../misc/constants'
import Delaunay from '../components/delaunay'
import Point from '../components/point'
import Legend from '../components/legend'

export default class LineChart extends AbstractChart {
  delaunay = null

  // one delaunay point per line
  delaunayPoints = []

  /**
   * Creates a new line graph.
   * @param {Boolean | Array} [area=[]] specifies for which sub-array of data an area should be shown. Boolean if data is a simple array.
   * @param {Array} [confidenceBand] array with two elements specifying how to access the lower (first) and upper (second) value for the confidence band. The two elements work like accessors and are either a string or a function.
   * @param {Object} [voronoi] custom parameters passed to the voronoi generator.
   */
  constructor ({ area, confidenceBand, voronoi, ...args }) {
    super(args)

    // compute lines and delaunay points
    this.data.forEach((lineData, index) => {
      const line = new Line({
        data: lineData,
        xAccessor: this.xAccessor,
        yAccessor: this.yAccessor,
        xScale: this.xScale,
        yScale: this.yScale,
        color: this.colors[index]
      })
      this.delaunayPoints[index] = new Point({
        xAccessor: this.xAccessor,
        yAccessor: this.yAccessor,
        xScale: this.xScale,
        yScale: this.yScale,
        radius: 3
      })
      line.mountTo(this.container)
    })

    // generate areas if necessary
    if (typeof area !== 'undefined') {
      let areas
      const areaGenerator = (lineData, index) => new Area({
        data: lineData,
        xAccessor: this.xAccessor,
        yAccessor: this.yAccessor,
        xScale: this.xScale,
        yScale: this.yScale,
        color: this.colors[index]
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

    // generate confidence band if necessary
    if (typeof confidenceBand !== 'undefined') {
      const confidenceBandGenerator = new Area({
        data: this.data[0], // confidence band only makes sense for one line
        xAccessor: this.xAccessor,
        y0Accessor: typeof confidenceBand[0] === 'function' ? confidenceBand[0] : d => d[confidenceBand[0]],
        y1Accessor: typeof confidenceBand[1] === 'function' ? confidenceBand[1] : d => d[confidenceBand[1]],
        xScale: this.xScale,
        yScale: this.yScale,
        color: '#aaa'
      })
      confidenceBandGenerator.mountTo(this.container)
    }

    // add markers
    const markerContainer = this.svg.append('g').attr('transform', `translate(${this.left},${this.top})`)
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

    // generate delaunator
    this.delaunay = new Delaunay({
      points: this.data,
      xAccessor: this.xAccessor,
      yAccessor: this.yAccessor,
      xScale: this.xScale,
      yScale: this.yScale,
      onPoint: (points) => {
        // pre-hide all points
        this.delaunayPoints.forEach(dp => {
          dp.hide()
        })

        points.forEach(point => {
          const index = point.arrayIndex || 0
          const color = this.colors[index]

          // set hover point
          this.delaunayPoints[index].update({ data: point, color })
          if (!this.delaunayPoints[index].shapeObject) {
            this.delaunayPoints[index].mountTo(this.container)
          }
        })

        // set tooltip
        if (this.tooltip) {
          this.tooltip.update({
            legendObject: constants.legendObject.line,
            data: points
          })
        }
      },
      onLeave: () => {
        this.delaunayPoints.forEach(dp => dp.hide())
        if (this.tooltip) this.tooltip.hide()
      },
      ...voronoi
    })
    this.delaunay.mountTo(this.container)

    // mount legend if any
    if (this.legend && this.legend.length > 0 && this.legendTarget) {
      const legend = new Legend({
        legend: this.legend,
        colorScheme: this.colors,
        symbolType: constants.legendObject.line
      })
      legend.mountTo(this.legendTarget)
    }
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

  computeDomains () {
    const flatData = this.data.flat()
    const xExtent = extent(flatData, this.xAccessor)
    const yExtent = extent(flatData, this.yAccessor)
    this.xScale.domain = xExtent
    this.yScale.domain = yExtent
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
