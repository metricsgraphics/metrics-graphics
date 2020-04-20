import constants from '../misc/constants'
import { select } from 'd3-selection'

export default class Legend {
  legend = []
  colorScheme = []
  symbolType = ''

  /**
   * Set up a new legend.
   *
   * @param {Array} legend array of descriptive legend strings.
   * @param {Array} colorScheme colors used for the legend. Will be darkened for better visibility.
   * @param {String} symbol used in the legend (line, circle, square).
   */
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
    let usePound = false

    if (color[0] === '#') {
      color = color.slice(1)
      usePound = true
    }

    const num = parseInt(color, 16)

    let r = (num >> 16) + amount

    if (r > 255) r = 255
    else if (r < 0) r = 0

    let b = ((num >> 8) & 0x00FF) + amount

    if (b > 255) b = 255
    else if (b < 0) b = 0

    let g = (num & 0x0000FF) + amount

    if (g > 255) g = 255
    else if (g < 0) g = 0

    return (usePound ? '#' : '') + (g | (b << 8) | (r << 16)).toString(16)
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
