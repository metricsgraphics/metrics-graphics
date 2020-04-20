import AbstractShape from './abstractShape'

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
