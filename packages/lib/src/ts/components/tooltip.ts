import constants from '../misc/constants'
import {
  TextFunction,
  AccessorFunction,
  GenericD3Selection
} from '../misc/typings'

export enum TooltipSymbol {
  CIRCLE = 'circle',
  LINE = 'line',
  SQUARE = 'square'
}

export interface ITooltip {
  /** symbol to show in the tooltip (defaults to line) */
  legendObject?: TooltipSymbol

  /** description of the different data arrays shown in the legend */
  legend?: Array<string>

  /** array of colors for the different data arrays, defaults to schemeCategory10 */
  colors?: Array<string>

  /** custom text formatting function -- generated from accessors if not defined */
  textFunction?: TextFunction

  /** entries to show in the tooltip, usually empty when first instantiating */
  data?: Array<any>

  /** margin to the left of the tooltip */
  left?: number

  /** margin to the top of the tooltip */
  top?: number

  /** if no custom text function is specified, specifies how to get the x value from a specific data point */
  xAccessor?: AccessorFunction

  /** if no custom text function is specified, specifies how to get the y value from a specific data point */
  yAccessor?: AccessorFunction
}

export default class Tooltip {
  legendObject = TooltipSymbol.LINE
  legend: Array<string>
  colors = constants.defaultColors
  data: Array<any>
  left = 0
  top = 0
  node: any
  textFunction = (x: any) => `${x}`

  constructor({
    legendObject,
    legend,
    colors,
    textFunction,
    data,
    left,
    top,
    xAccessor,
    yAccessor
  }: ITooltip) {
    this.legendObject = legendObject ?? this.legendObject
    this.legend = legend ?? []
    this.colors = colors ?? this.colors
    this.setTextFunction(textFunction, xAccessor, yAccessor)
    this.data = data ?? []
    this.left = left ?? this.left
    this.top = top ?? this.top
  }

  /**
   * Sets the text function for the tooltip.
   *
   * @param textFunction custom text function for the tooltip text. Generated from xAccessor and yAccessor if not
   * @param xAccessor if no custom text function is specified, this function specifies how to get the x value from a specific data point.
   * @param yAccessor if no custom text function is specified, this function specifies how to get the y value from a specific data point.
   */
  setTextFunction(
    textFunction?: TextFunction,
    xAccessor?: AccessorFunction,
    yAccessor?: AccessorFunction
  ): void {
    this.textFunction =
      textFunction ||
      (xAccessor && yAccessor
        ? this.baseTextFunction(xAccessor, yAccessor)
        : this.textFunction)
  }

  /**
   * If no textFunction was specified when creating the tooltip instance, this method generates a text function based on the xAccessor and yAccessor.
   *
   * @param xAccessor returns the x value of a given data point.
   * @param yAccessor returns the y value of a given data point.
   * @returns base text function used to render the tooltip for a given datapoint.
   */
  baseTextFunction(
    xAccessor: AccessorFunction,
    yAccessor: AccessorFunction
  ): TextFunction {
    return (point: any) => `${xAccessor(point)}: ${yAccessor(point)}`
  }

  /**
   * Update the tooltip.
   */
  update({
    data,
    legendObject,
    legend
  }: Pick<ITooltip, 'data' | 'legendObject' | 'legend'>): void {
    this.data = data ?? this.data
    this.legendObject = legendObject ?? this.legendObject
    this.legend = legend ?? this.legend
    this.addText()
  }

  /**
   * Hide the tooltip (without destroying it).
   */
  hide(): void {
    this.node.attr('opacity', 0)
  }

  /**
   * Mount the tooltip to the given d3 node.
   *
   * @param svg d3 node to mount the tooltip to.
   */
  mountTo(svg: GenericD3Selection): void {
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
   */
  addText(): void {
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
      node.append('tspan').attr('dx', '0.5rem').attr('fill', color).text(symbol)

      // text
      node.append('tspan').attr('dx', '0.5rem').text(this.textFunction(datum))
    })
  }
}
