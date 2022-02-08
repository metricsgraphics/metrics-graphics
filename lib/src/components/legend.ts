import constants from '../misc/constants'
import { select } from 'd3-selection'
import { LegendSymbol } from '../misc/typings'

export interface ILegend {
  /** array of descriptive legend strings */
  legend: Array<string>

  /** colors used for the legend -- will be darkened for better visibility */
  colorScheme: Array<string>

  /** symbol used in the legend */
  symbolType: LegendSymbol
}

export default class Legend {
  legend: Array<string>
  colorScheme: Array<string>
  symbolType: LegendSymbol

  constructor({ legend, colorScheme, symbolType }: ILegend) {
    this.legend = legend
    this.colorScheme = colorScheme
    this.symbolType = symbolType
  }

  /**
   * Darken a given color by a given amount.
   *
   * @see https://css-tricks.com/snippets/javascript/lighten-darken-color/
   * @param color hex color specifier
   * @param amount how much to darken the color
   * @returns darkened color in hex representation.
   */
  darkenColor(color: string, amount: number): string {
    // remove hash
    color = color.slice(1)

    const num = parseInt(color, 16)

    const r = this.clamp((num >> 16) + amount)
    const b = this.clamp(((num >> 8) & 0x00ff) + amount)
    const g = this.clamp((num & 0x0000ff) + amount)

    return '#' + (g | (b << 8) | (r << 16)).toString(16)
  }

  /**
   * Clamp a number between 0 and 255.
   *
   * @param number number to be clamped.
   * @returns clamped number.
   */
  clamp(number: number): number {
    return number > 255 ? 255 : number < 0 ? 0 : number
  }

  /**
   * Mount the legend to the given node.
   *
   * @param node d3 specifier or d3 node to mount the legend to.
   */
  mountTo(node: any) {
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
