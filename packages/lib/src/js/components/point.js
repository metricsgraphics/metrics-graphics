export default class Point {
  point = null
  cx = 0
  cy = 0
  radius = 1
  color = null

  constructor ({ point, xAccessor, yAccessor, xScale, yScale, color, index, radius }) {
    this.cx = xScale.scaleObject(xAccessor(point))
    this.cy = yScale.scaleObject(yAccessor(point))
    this.color = typeof color === 'function'
      ? color(index)
      : Array.isArray(color)
        ? color[index]
        : color
    this.radius = radius ?? this.radius
  }

  mountTo (svg) {
    this.point = svg
      .append('circle')
      .attr('cx', this.cx)
      .attr('cy', this.cy)
      .attr('r', this.radius)
      .attr('fill', this.color)
  }

  dismount () {
    this.point.remove()
  }
}
