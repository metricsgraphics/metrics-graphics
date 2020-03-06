import constants from '../misc/constants'

export default class Legend {
  legend = []
  colorScheme = []
  symbolType = ''

  constructor ({ legend, colorScheme, symbolType }) {
    this.legend = legend
    this.colorScheme = colorScheme
    this.symbolType = symbolType
  }

  mountTo (node) {
    const symbol = constants.symbol[this.symbolType]

    this.legend.forEach((item, index) => {
      node
        .append('span')
        .classed('text-legend', true)
        .style('color', this.colorScheme[index])
        .text(`${symbol} ${item}`)
    })
  }
}
