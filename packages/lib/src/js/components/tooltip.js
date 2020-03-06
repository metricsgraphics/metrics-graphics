import constants from '../misc/constants'

export default class Tooltip {
  left = 0
  top = 0
  legendObject = 'line'
  legendCategory = ''
  color = '#000000'
  text = ''
  node = null
  categoryNode = null
  symbolNode = null
  textNode = null
  textFunction = d => d

  constructor ({ legendObject, legendCategory, color, textFunction, data, left, top, xAccessor, yAccessor } = {}) {
    this.legendObject = legendObject ?? this.legendObject
    this.legendCategory = legendCategory ?? this.legendCategory
    this.color = color ?? this.color
    this.textFunction = textFunction || ((xAccessor && yAccessor)
      ? this.baseTextFunction({ xAccessor, yAccessor })
      : this.textFunction)
    this.text = data ? this.textFunction(data) : ''
    this.left = left ?? this.left
    this.top = top ?? this.top
  }

  baseTextFunction ({ xAccessor, yAccessor }) {
    return point => `${xAccessor(point)}: ${yAccessor(point)}`
  }

  update ({ color, data, legendCategory }) {
    console.log('updating tooltip: ')
    this.node.attr('opacity', 1)
    if (color) {
      this.symbolNode.attr('fill', color)
      this.categoryNode.attr('fill', color)
    }
    if (data) this.textNode.text(this.textFunction(data))
    if (legendCategory) this.categoryNode.text(legendCategory)
  }

  hide () {
    this.node.attr('opacity', 0)
  }

  mountTo (svg) {
    this.node = svg
      .append('text')
      .style('font-size', '0.7rem')
      .attr('transform', `translate(${this.left},${this.top})`)
      .attr('text-anchor', 'end')
      .attr('opacity', 0)
    const symbol = constants.symbol[this.legendObject]
    this.categoryNode = this.node
      .append('tspan')
      .classed('text-category', true)
      .text(this.categoryNode)
    this.symbolNode = this.node
      .append('tspan')
      .attr('dx', '0.5rem')
      .text(symbol)
    this.textNode = this.node
      .append('tspan')
      .attr('dx', '0.5rem')
      .text(this.text)
  }
}
