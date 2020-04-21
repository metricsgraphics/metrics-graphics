import AbstractShape from './abstractShape'

/**
 * Create a new rectangle.
 *
 * @param {Object} args argument object. See {@link AbstractShape} for general parameters.
 * @param {Function} args.xAccessor function to access the x value of the rectangle.
 * @param {Function} args.yAccessor function to access the y value of the rectangle.
 * @param {Function} args.widthAccessor function to access the width of the rectangle.
 * @param {Function} args.heightAccessor function to access the height of the rectangle.
 */
export default class Rect extends AbstractShape {
  xAccessor = null
  yAccessor = null
  widthAccessor = null
  heightAccessor = null

  constructor ({ xAccessor, yAccessor, widthAccessor, heightAccessor, ...args }) {
    super(args)
    this.xAccessor = xAccessor
    this.yAccessor = yAccessor
    this.widthAccessor = widthAccessor
    this.heightAccessor = heightAccessor
  }

  get x () { return this.xScale.scaleObject(this.xAccessor(this.data)) }
  get y () { return this.yScale.scaleObject(this.yAccessor(this.data)) }
  get width () { return Math.max(0, this.xScale.scaleObject(this.widthAccessor(this.data))) }
  get height () { return Math.max(0, this.yScale.scaleObject(this.heightAccessor(this.data))) }

  /**
   * Mount the rectangle to the given node.
   *
   * @param {Object} svg d3 node to mount the rectangle to.
   * @returns {void}
   */
  mountTo (svg) {
    this.shapeObject = svg
      .append('rect')
      .attr('x', this.x)
      .attr('y', this.y)
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('pointer-events', 'none')
      .attr('fill', this.color)
      .attr('stroke', this.color)
      .attr('fill-opacity', this.fillOpacity)
      .attr('stroke-width', this.strokeWidth)
  }

  /**
   * Update the rectangle.
   *
   * @param {Object} data updated data object.
   * @returns {void}
   */
  update ({ data, ...args }) {
    this.updateGeneric(args)
    if (data) {
      this.data = data
      if (!this.shapeObject) return
      this.shapeObject
        .attr('x', this.x)
        .attr('y', this.y)
        .attr('width', this.width)
        .attr('height', this.height)
        .attr('opacity', 1)
    }
  }
}
