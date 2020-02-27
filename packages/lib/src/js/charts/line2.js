import AbstractChart from './abstractChart'
import { extent } from 'd3-array'
import Line from '../components/line'
import Area from '../components/area'

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

  constructor ({ area, ...args }) {
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
