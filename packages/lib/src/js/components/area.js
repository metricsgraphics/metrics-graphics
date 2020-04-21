import { area, curveCatmullRom } from 'd3-shape'

/**
 * Create a new area shape.
 * Meant to be used together with a {@link Line}.
 *
 * @param {Object} args argument object.
 * @param {Array} args.data data for which the shape should be created.
 * @param {Function} args.xAccessor x accessor function.
 * @param {Function} args.yAccessor y accessor function.
 * @param {Function} args.y0Accessor y base accessor function. Defaults to static 0.
 * @param {Function} args.y1Accessor alternative to yAccessor.
 * @param {Scale} args.xScale scale used to scale elements in x direction.
 * @param {Scale} args.yScale scale used to scale elements in y direction.
 * @param {Function} args.curve curving function. See {@link https://github.com/d3/d3-shape#curves} for available curves in d3.
 * @param {String} [args.color='none'] color of the area.
 */
export default class Area {
  areaObject = null
  data = null
  index = 0
  color = null

  constructor ({
    data,
    xAccessor,
    yAccessor,
    y0Accessor,
    y1Accessor,
    xScale,
    yScale,
    curve,
    color
  }) {
    // cry if no data was passed
    if (!data) throw new Error('line needs data')
    this.data = data
    this.color = color

    const y0 = y0Accessor ?? (d => 0)
    const y1 = y1Accessor ?? yAccessor

    // set up line object
    this.areaObject = area()
      .x(d => xScale.scaleObject(xAccessor(d)))
      .y1(d => yScale.scaleObject(y1(d)))
      .y0(d => yScale.scaleObject(y0(d)))
      .curve(curve ?? curveCatmullRom)
  }

  /**
   * Mount the area to a given d3 node.
   *
   * @param {Object} svg d3 node to mount the area to.
   * @returns {void}
   */
  mountTo (svg) {
    svg
      .append('path')
      .classed('mg-area', true)
      .attr('fill', this.color)
      .datum(this.data)
      .attr('d', this.areaObject)
  }
}
