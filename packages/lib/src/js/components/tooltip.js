import constants from '../misc/constants'
import { schemeCategory10 } from 'd3-scale-chromatic'

/**
 * Set up a new tooltip.
 *
 * @param {Object} args argument object.
 * @param {String} [args.legendObject='line'] symbol to show in the tooltip (circle, line, square).
 * @param {Array} [args.legend=[]] legend used to correctly describe data in multi-dimensional cases.
 * @param {Array} [args.colors=schemeCategory10] color scheme for multi-dimensional cases.
 * @param {Function} [args.textFunction] custom text function for the tooltip text. Generated from xAccessor and yAccessor if not
 * @param {Array} [args.data=[]] entries to show in the tooltip. This is usually empty when first instantiating the tooltip.
 * @param {Number} [args.left=0] margin to the left of the tooltip.
 * @param {Number} [args.top=0] margin to the top of the tooltip.
 * @param {Function} [args.xAccessor] if no custom text function is specified, this function specifies how to get the x value from a specific data point.
 * @param {Function} [args.yAccessor] if no custom text function is specified, this function specifies how to get the y value from a specific data point.
 */
export default class Tooltip {
  legendObject = 'line'
  legend = []
  colors = schemeCategory10
  data = []
  left = 0
  top = 0
  node = null

  constructor ({ legendObject, legend, colors, textFunction, data, left, top, xAccessor, yAccessor } = {}) {
    this.legendObject = legendObject ?? this.legendObject
    this.legend = legend ?? this.legend
    this.colors = colors ?? this.colors
    this.setTextFunction(textFunction, xAccessor, yAccessor)
    this.data = data ?? this.data
    this.left = left ?? this.left
    this.top = top ?? this.top
  }

  /**
   * Sets the text function for the tooltip.
   *
   * @param {Function} [textFunction] custom text function for the tooltip text. Generated from xAccessor and yAccessor if not
   * @param {Function} [xAccessor] if no custom text function is specified, this function specifies how to get the x value from a specific data point.
   * @param {Function} [yAccessor] if no custom text function is specified, this function specifies how to get the y value from a specific data point.
   * @returns {void}
   */
  setTextFunction (textFunction, xAccessor, yAccessor) {
    this.textFunction = textFunction || (xAccessor && yAccessor
      ? this.baseTextFunction({ xAccessor, yAccessor })
      : this.textFunction)
  }

  /**
   * If no textFunction was specified when creating the tooltip instance, this method generates a text function based on the xAccessor and yAccessor.
   *
   * @param {Function} xAccessor returns the x value of a given data point.
   * @param {Function} yAccessor returns the y value of a given data point.
   * @returns {Function} base text function used to render the tooltip for a given datapoint.
   */
  baseTextFunction ({ xAccessor, yAccessor }) {
    return point => `${xAccessor(point)}: ${yAccessor(point)}`
  }

  /**
   * Update the tooltip.
   *
   * @param {Array} data array of data points to be shown in the tooltip.
   * @param {String} legendObject update the type of legend object to be shown in the tooltip (line, circle, square).
   * @param {Array} legend legend used by the graph.
   * @returns {void}
   */
  update ({ data, legendObject, legend }) {
    this.data = data ?? this.data
    this.legendObject = legendObject ?? this.legendObject
    this.legend = legend ?? this.legend
    this.addText()
  }

  /**
   * Hide the tooltip (without destroying it).
   * @returns {void}
   */
  hide () {
    this.node.attr('opacity', 0)
  }

  /**
   * Mount the tooltip to the given d3 node.
   *
   * @param {Object} svg d3 node to mount the tooltip to.
   * @returns {void}
   */
  mountTo (svg) {
    this.node = svg
      .append('g')
      .style('font-size', '0.7rem')
      .attr('transform', `translate(${this.left},${this.top})`)
      .attr('opacity', 0)
    this.addText()
  }

  /**
   * Adds the text to the tooltip.
   * For each datapoint in the data array, one line is added to the tooltip.
   *
   * @returns {void}
   */
  addText () {
    // first, clear existing content
    this.node.selectAll('*').remove()

    // second, add one line per data entry
    this.node.attr('opacity', 1)
    this.data.forEach((datum, index) => {
      const symbol = constants.symbol[this.legendObject]
      const realIndex = datum.arrayIndex ?? index
      const color = this.colors[realIndex]
      const node = this.node
        .append('text')
        .attr('text-anchor', 'end')
        .attr('y', index * 12)

      // category
      node
        .append('tspan')
        .classed('text-category', true)
        .attr('fill', color)
        .text(this.legend[realIndex])

      // symbol
      node
        .append('tspan')
        .attr('dx', '0.5rem')
        .attr('fill', color)
        .text(symbol)

      // text
      node
        .append('tspan')
        .attr('dx', '0.5rem')
        .text(this.textFunction(datum))
    })
  }
}
