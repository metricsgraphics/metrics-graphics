export default class Point {
  point = null
  pointObject = null
  xAccessor = null
  yAccessor = null
  xScale = null
  yScale = null
  radius = 1
  color = null
  fillOpacity = 1
  strokeWidth = 0

  constructor ({ point, xAccessor, yAccessor, xScale, yScale, color, radius, fillOpacity, strokeWidth }) {
    this.point = point
    this.xAccessor = xAccessor
    this.yAccessor = yAccessor
    this.xScale = xScale
    this.yScale = yScale
    this.color = color
    this.radius = radius ?? this.radius
    this.fillOpacity = fillOpacity ?? this.fillOpacity
    this.strokeWidth = strokeWidth ?? this.strokeWidth
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
      .attr('stroke', this.color)
      .attr('fill-opacity', this.fillOpacity)
      .attr('stroke-width', this.strokeWidth)
  }

  hide () {
    this.pointObject.attr('opacity', 0)
  }

  update ({ point, color, fillOpacity, strokeWidth }) {
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
    if (fillOpacity) {
      this.fillOpacity = fillOpacity
      this.pointObject.attr('fill-opacity', this.fillOpacity)
    }
    if (strokeWidth) {
      this.strokeWidth = strokeWidth
      this.pointObject.attr('stroke-width', this.strokeWidth)
    }
  }

  dismount () {
    this.pointObject.remove()
  }
}
