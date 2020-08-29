import constants from '../misc/constants'
import { AccessorFunction, GenericD3Selection } from '../misc/typings'
import Scale from './scale'

enum RugOrientation {
  HORIZONTAL = 'horizontal',
  VERTICAL = 'vertical'
}

interface IRug {
  /** accessor used to get the rug value for a given datapoint */
  accessor: AccessorFunction

  /**scale function of the rug */
  scale: Scale

  /** data to be rugged */
  data: Array<any>

  /** length of the rug's ticks */
  tickLength?: number

  /** color scheme of the rug ticks */
  colors?: Array<string>

  /** orientation of the rug */
  orientation?: RugOrientation

  /** left margin of the rug */
  left?: number

  /** top margin of the rug */
  top?: number
}

export default class Rug {
  accessor: AccessorFunction
  scale: Scale
  rugObject: any
  data: Array<any>
  left = 0
  top = 0
  tickLength = 5
  colors = constants.defaultColors
  orientation = RugOrientation.HORIZONTAL

  constructor({
    accessor,
    scale,
    data,
    tickLength,
    colors,
    orientation,
    left,
    top
  }: IRug) {
    this.accessor = accessor
    this.scale = scale
    this.data = data
    this.tickLength = tickLength ?? this.tickLength
    this.colors = colors ?? this.colors
    this.orientation = orientation ?? this.orientation
    this.left = left ?? this.left
    this.top = top ?? this.top
  }

  get isVertical(): boolean {
    return this.orientation === constants.orientation.vertical
  }

  /**
   * Mount the rug to the given node.
   *
   * @param svg d3 node to mount the rug to.
   */
  mountTo(svg: GenericD3Selection): void {
    // add container
    const top = this.isVertical ? this.top : this.top - this.tickLength
    const container = svg
      .append('g')
      .attr('transform', `translate(${this.left},${top})`)

    // add lines
    this.data.forEach((dataArray, i) =>
      dataArray.forEach((datum: any) => {
        const value = this.scale.scaleObject(this.accessor(datum))
        container
          .append('line')
          .attr(this.isVertical ? 'y1' : 'x1', value)
          .attr(this.isVertical ? 'y2' : 'x2', value)
          .attr(this.isVertical ? 'x1' : 'y1', 0)
          .attr(this.isVertical ? 'x2' : 'y2', this.tickLength)
          .attr('stroke', this.colors[i])
      })
    )
  }
}
