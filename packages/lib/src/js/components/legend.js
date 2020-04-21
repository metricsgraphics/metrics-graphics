import constants from '../misc/constants'
import { select } from 'd3-selection'

/**
 * Set up a new legend.
 *
 * @param {Object} args argument object.
 * @param {Array} args.legend array of descriptive legend strings.
 * @param {Array} args.colorScheme colors used for the legend. Will be darkened for better visibility.
 * @param {String} args.symbol used in the legend (line, circle, square).
 */
export default class Legend {
  legend = []
  colorScheme = []
  symbolType = ''

  constructor ({ legend, colorScheme, symbolType }) {
    this.legend = legend
    this.colorScheme = colorScheme
    this.symbolType = symbolType
  }

  /**
   * Darken a given color by a given amount.
   *
   * @see https://css-tricks.com/snippets/javascript/lighten-darken-color/
   * @param {String} color hex color specifier
   * @param {Number} amount how much to darken the color.
   * @returns {String} darkened color in hex representation.
   */
  darkenColor (color, amount) {
    // remove hash
    color = color.slice(1)

    const num = parseInt(color, 16)

    const r = this.clamp((num >> 16) + amount)
    const b = this.clamp(((num >> 8) & 0x00FF) + amount)
    const g = this.clamp((num & 0x0000FF) + amount)

    return '#' + (g | (b << 8) | (r << 16)).toString(16)
  }

  /**
   * Clamp a number between 0 and 255.
   *
   * @param {Number} number number to be clamped.
   * @returns {Number} clamped number.
   */
  clamp (number) {
    return number > 255
      ? 255
      : number < 0
        ? 0
        : number
  }

  /**
   * Mount the legend to the given node.
   *
   * @param {String | Object} node d3 specifier or d3 node to mount the legend to.
   * @returns {void}
   */
  mountTo (node) {
    const symbol = constants.symbol[this.symbolType]

    // create d3 selection if necessary
    if (typeof node === 'string') node = select(node)

    this.legend.forEach((item, index) => {
      node
        .append('span')
        .classed('text-legend', true)
        .style('color', this.darkenColor(this.colorScheme[index], -10))
        .text(`${symbol} ${item}`)
    })
  }
}
