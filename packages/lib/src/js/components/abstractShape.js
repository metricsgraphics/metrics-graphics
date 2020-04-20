export default class AbstractShape {
  data = null
  shapeObject = null
  xScale = null
  yScale = null
  color = null
  fillOpacity = 1
  strokeWidth = 0

  constructor ({ data, xScale, yScale, color, fillOpacity, strokeWidth }) {
    this.data = data
    this.xScale = xScale
    this.yScale = yScale
    this.color = color
    this.fillOpacity = fillOpacity
    this.strokeWidth = strokeWidth
  }

  mountTo (svg) {}

  hide () {
    if (this.shapeObject) this.shapeObject.attr('opacity', 0)
  }

  update (args) {}

  updateGeneric ({ color, fillOpacity, strokeWidth }) {
    if (color) {
      this.color = color
      if (this.shapeObject) this.shapeObject.attr('fill', this.color)
    }
    if (fillOpacity) {
      this.fillOpacity = fillOpacity
      if (this.shapeObject) this.shapeObject.attr('fill-opacity', this.fillOpacity)
    }
    if (strokeWidth) {
      this.strokeWidth = strokeWidth
      if (this.shapeObject) this.shapeObject.attr('stroke-width', this.strokeWidth)
    }
  }

  dismount () {
    if (this.shapeObject) this.shapeObject.remove()
  }
}
