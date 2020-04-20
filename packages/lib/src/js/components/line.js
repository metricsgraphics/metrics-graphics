import { line, curveCatmullRom } from 'd3-shape'

export default class Line {
  lineObject = null
  data = null
  color = null

  /**
   * Create a new line.
   *
   * @param {Array} data array of data points used to create the line.
   * @param {Function} xAccessor function to access the x value for a given data point.
   * @param {Function} yAccessor function to access the y value for a given data point.
   * @param {Scale} xScale scale used to compute x values.
   * @param {Scale} yScale scale used to compute y values.
   * @param {Function} [curve=catmullRom] curving function used to draw the line. See {@link https://github.com/d3/d3-shape#curves} for curves available in d3.
   * @param {String} color color of the line.
   */
  constructor ({
    data,
    xAccessor,
    yAccessor,
    xScale,
    yScale,
    curve,
    color
  }) {
    // cry if no data was passed
    if (!data) throw new Error('line needs data')
    this.data = data
    this.color = color

    // set up line object
    this.lineObject = line()
      .x(d => xScale.scaleObject(xAccessor(d)))
      .y(d => yScale.scaleObject(yAccessor(d)))
      .curve(curve ?? curveCatmullRom)
  }

  mountTo (svg) {
    svg
      .append('path')
      .classed('mg-line', true)
      .attr('stroke', this.color)
      .datum(this.data)
      .attr('d', this.lineObject)
  }
}
