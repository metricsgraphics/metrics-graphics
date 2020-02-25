import AbstractChart from './abstractChart'
import { extent } from 'd3-array'
import Line from '../components/line'

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

  constructor (args) {
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
