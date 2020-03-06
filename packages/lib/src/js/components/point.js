export default class Point {
  point = null
  pointObject = null
  xAccessor = null
  yAccessor = null
  xScale = null
  yScale = null
  radius = 1
  color = null

  constructor ({ point, xAccessor, yAccessor, xScale, yScale, color, radius }) {
    this.point = point
    this.xAccessor = xAccessor
    this.yAccessor = yAccessor
    this.xScale = xScale
    this.yScale = yScale
    this.color = color
    this.radius = radius ?? this.radius
  }

  get cx () { return this.xScale.scaleObject(this.xAccessor(this.point)) }
  get cy () { return this.yScale.scaleObject(this.yAccessor(this.point)) }

  mountTo (svg) {
    this.pointObject = svg
      .append('circle')
      .attr('cx', this.cx)
      .attr('pointer-events', 'none')
      .attr('cy', this.cy)
      .attr('r', this.radius)
      .attr('fill', this.color)
  }

  hide () {
    this.pointObject.attr('opacity', 0)
  }

  update ({ point, color }) {
    if (point) {
      this.point = point
      if (!this.pointObject) return
      this.pointObject
        .attr('cx', this.cx)
        .attr('cy', this.cy)
        .attr('opacity', 1)
    }
    if (color) {
      this.color = color
      if (this.pointObject) this.pointObject.attr('fill', this.color)
    }
  }

  dismount () {
    this.pointObject.remove()
  }
}
