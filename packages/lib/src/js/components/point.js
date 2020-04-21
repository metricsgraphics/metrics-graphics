import AbstractShape from './abstractShape'

/**
 * Create a new point.
 *
 * @param {Object} args argument object. See {@link AbstractShape} for general parameters.
 * @param {Function} args.xAccessor function to access the x value of the point.
 * @param {Function} args.yAccessor function to access the y value of the point.
 * @param {Number} [args.radius=1] radius of the point.
 */
export default class Point extends AbstractShape {
  xAccessor = null
  yAccessor = null
  radius = 1

  constructor ({ xAccessor, yAccessor, radius, ...args }) {
    super(args)
    this.xAccessor = xAccessor
    this.yAccessor = yAccessor
    this.radius = radius ?? this.radius
  }

  get cx () { return this.xScale.scaleObject(this.xAccessor(this.data)) }
  get cy () { return this.yScale.scaleObject(this.yAccessor(this.data)) }

  /**
   * Mount the point to the given node.
   *
   * @param {Object} svg d3 node to mount the point to.
   * @returns {void}
   */
  mountTo (svg) {
    this.shapeObject = svg
      .append('circle')
      .attr('cx', this.cx)
      .attr('pointer-events', 'none')
      .attr('cy', this.cy)
      .attr('r', this.radius)
      .attr('fill', this.color)
      .attr('stroke', this.color)
      .attr('fill-opacity', this.fillOpacity)
      .attr('stroke-width', this.strokeWidth)
  }

  /**
   * Update the point.
   *
   * @param {Object} data point object
   * @returns {void}
   */
  update ({ data, ...args }) {
    this.updateGeneric(args)
    if (data) {
      this.data = data
      if (!this.shapeObject) return
      this.shapeObject
        .attr('cx', this.cx)
        .attr('cy', this.cy)
        .attr('opacity', 1)
    }
  }
}
