import AbstractChart from './abstractChart'
import Axis from '../axis/axis'
import { extent } from 'd3-array'

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
  constructor (args) {
    super(args)
    console.log('instantiating new line chart: ', args)

    this.normalizeData()
    this.computeDomains(args)

    // set up axes
    this.xAxis = new Axis({
      scale: this.xScale,
      orientation: 'bottom',
      top: this.bottom,
      left: this.left,
      ...args.xAxis
    })
    this.yAxis = new Axis({
      scale: this.yScale,
      orientation: 'left',
      top: this.top,
      left: this.left,
      ...args.yAxis
    })
    this.xAxis.mountTo(this.svg)
    this.yAxis.mountTo(this.svg)
  }

  /**
   * Normalizes the passed data to a nested array of objects.
   *
   * isSingleObject: return error
   * isArrayOfObjects: nest once
   * isArrayOfArrays: do nothing
   * isNestedArrayOfArrays: do nothing, assume index-based accessor
   * isNestedArrayOfObjects: do nothing
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
}
