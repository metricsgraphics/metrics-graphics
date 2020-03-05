import AbstractChart from './abstractChart'
import { extent } from 'd3-array'
import Line from '../components/line'
import Area from '../components/area'
import constants from '../misc/constants'
import Delaunay from '../components/delaunay'
import Point from '../components/point'
import { schemeCategory10 } from 'd3-scale-chromatic'

/**
 * Sets up a new line chart.
 * Example parameterization:
  {
    data: [
      {
        "year": "1945",
        "sightings": 6
      },
      {
        "year": "1946",
        "sightings": 8
      },
      ...
    ],
    width: 650,
    height: 150,
    target: '#ufo-sightings',
    x_accessor: 'year',
    y_accessor: 'sightings',
    markers: [{'year': 1964, 'label': '"The Creeping Terror" released'}]
  }
 */
export default class LineChart extends AbstractChart {
  lines = []
  delaunay = null
  delaunayPoint = null

  constructor ({ area, confidenceBand, ...args }) {
    super(args)

    // compute lines
    this.lines = this.data.map(lineData => new Line({
      data: lineData,
      xAccessor: this.xAccessor,
      yAccessor: this.yAccessor,
      xScale: this.xScale,
      yScale: this.yScale
    }))

    // mount lines
    this.lines.forEach(line => line.mountTo(this.container))

    // generate areas if necessary
    if (typeof area !== 'undefined') {
      let areas
      const areaGenerator = lineData => new Area({
        data: lineData,
        xAccessor: this.xAccessor,
        yAccessor: this.yAccessor,
        xScale: this.xScale,
        yScale: this.yScale
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
        y0Accessor: d => d[confidenceBand[0]],
        y1Accessor: d => d[confidenceBand[1]],
        xScale: this.xScale,
        yScale: this.yScale,
        color: '#aaa'
      })
      confidenceBandGenerator.mountTo(this.container)
    }

    // WIP delaunay
    this.delaunay = new Delaunay({
      points: this.data.flat(Infinity),
      xAccessor: this.xAccessor,
      yAccessor: this.yAccessor,
      xScale: this.xScale,
      yScale: this.yScale,
      onPoint: (point) => {
        // delete point if exists and re-mount
        if (this.delaunayPoint) this.delaunayPoint.dismount()
        this.delaunayPoint = new Point({
          point,
          xAccessor: this.xAccessor,
          yAccessor: this.yAccessor,
          xScale: this.xScale,
          yScale: this.yScale,
          color: schemeCategory10,
          index: point.arrayIndex ?? 0,
          radius: 3
        })
        this.delaunayPoint.mountTo(this.container)
      }
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
