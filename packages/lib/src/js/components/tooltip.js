import constants from '../misc/constants'

export default class Tooltip {
  legendObject = 'line'
  legend = []
  colors = ['#000000']
  textFunction = d => d
  data = []
  left = 0
  top = 0
  node = null

  constructor ({ legendObject, legend, colors, textFunction, data, left, top, xAccessor, yAccessor } = {}) {
    this.legendObject = legendObject ?? this.legendObject
    this.legend = legend ?? this.legend
    this.colors = colors ?? this.colors
    this.textFunction = textFunction || ((xAccessor && yAccessor)
      ? this.baseTextFunction({ xAccessor, yAccessor })
      : this.textFunction)
    this.data = data ?? this.data
    this.left = left ?? this.left
    this.top = top ?? this.top
  }

  baseTextFunction ({ xAccessor, yAccessor }) {
    return point => `${xAccessor(point)}: ${yAccessor(point)}`
  }

  update ({ colors, data, legendObject, legend }) {
    this.colors = colors ?? this.colors
    this.data = data ?? this.data
    this.legendObject = legendObject ?? this.legendObject
    this.legend = legend ?? this.legend
    this.addText()
  }

  hide () {
    this.node.attr('opacity', 0)
  }

  mountTo (svg) {
    this.node = svg
      .append('g')
      .style('font-size', '0.7rem')
      .attr('transform', `translate(${this.left},${this.top})`)
      .attr('opacity', 0)
    this.addText()
  }

  addText () {
    // first, clear existing content
    this.node.selectAll('*').remove()

    // second, add one line per data entry
    this.node.attr('opacity', 1)
    this.data.forEach((datum, index) => {
      const symbol = constants.symbol[this.legendObject]
      const node = this.node
        .append('text')
        .attr('text-anchor', 'end')
        .attr('y', index * 12)
        
      // category
      node
        .append('tspan')
        .classed('text-category', true)
        .attr('fill', this.colors[index])
        .text(this.legend[index])

      // symbol
      node
        .append('tspan')
        .attr('dx', '0.5rem')
        .attr('fill', this.colors[index])
        .text(symbol)

      // text
      node
        .append('tspan')
        .attr('dx', '0.5rem')
        .text(this.textFunction(datum))
    })
  }
}
