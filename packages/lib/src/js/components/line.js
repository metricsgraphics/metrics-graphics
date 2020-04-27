import { line, curveCatmullRom } from 'd3-shape'

/**
 * Create a new line.
 *
 * @param {Object} args argument object.
 * @param {Array} args.data array of data points used to create the line.
 * @param {Function} args.xAccessor function to access the x value for a given data point.
 * @param {Function} args.yAccessor function to access the y value for a given data point.
 * @param {Scale} args.xScale scale used to compute x values.
 * @param {Scale} args.yScale scale used to compute y values.
 * @param {Function} [args.curve=catmullRom] curving function used to draw the line. See {@link https://github.com/d3/d3-shape#curves} for curves available in d3.
 * @param {String} args.color color of the line.
 * @param {Function} [args.defined] optional function specifying whether or not to show a given datapoint.
 */
export default class Line {
  lineObject = null
  data = null
  color = null

  constructor ({
    data,
    xAccessor,
    yAccessor,
    xScale,
    yScale,
    curve,
    color,
    defined
  }) {
    // cry if no data was passed
    if (!data) throw new Error('line needs data')
    this.data = data
    this.color = color

    // set up line object
    this.lineObject = line()
      .defined(d => {
        if (yAccessor(d) === null) return false
        if (defined === null) return true
        return defined(d)
      })
      .x(d => xScale.scaleObject(xAccessor(d)))
      .y(d => yScale.scaleObject(yAccessor(d)))
      .curve(curve ?? curveCatmullRom)
  }

  /**
   * Mount the line to the given d3 node.
   *
   * @param {Object} svg d3 node to mount the line to.
   * @returns {void}
   */
  mountTo (svg) {
    svg
      .append('path')
      .classed('mg-line', true)
      .attr('stroke', this.color)
      .datum(this.data)
      .attr('d', this.lineObject)
  }
}
