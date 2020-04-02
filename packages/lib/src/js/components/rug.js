import { schemeCategory10 } from 'd3-scale-chromatic'
import constants from '../misc/constants'

export default class Rug {
  rugObject = null
  accessor = d => d
  scale = d => d
  data = []
  left = 0
  top = 0
  tickLength = 5
  colors = schemeCategory10
  orientation = constants.orientation.horizontal

  constructor ({ accessor, scale, data, tickLength, colors, orientation, left, top }) {
    this.accessor = accessor ?? this.accessor
    this.scale = scale ?? this.scale
    this.data = data ?? this.data
    this.tickLength = tickLength ?? this.tickLength
    this.colors = colors ?? this.colors
    this.orientation = orientation ?? this.orientation
    this.left = left ?? this.left
    this.top = top ?? this.top
  }

  get isVertical () { return this.orientation === constants.orientation.vertical }

  mountTo (svg) {
    // add container
    const top = this.isVertical ? this.top : this.top - this.tickLength
    const container = svg.append('g')
      .attr('transform', `translate(${this.left},${top})`)

    // add lines
    this.data.forEach((dataArray, i) => dataArray.forEach(datum => {
      const value = this.scale.scaleObject(this.accessor(datum))
      container.append('line')
        .attr(this.isVertical ? 'y1' : 'x1', value)
        .attr(this.isVertical ? 'y2' : 'x2', value)
        .attr(this.isVertical ? 'x1' : 'y1', 0)
        .attr(this.isVertical ? 'x2' : 'y2', this.tickLength)
        .attr('stroke', this.colors[i])
    }))
  }
}
