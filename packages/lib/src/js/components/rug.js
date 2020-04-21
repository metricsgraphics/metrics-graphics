import { schemeCategory10 } from 'd3-scale-chromatic'
import constants from '../misc/constants'

/**
 * Set up a new rug.
 *
 * @param {Object} args argument object.
 * @param {Function} args.accessor accessor used to get the rug value for a given data point.
 * @param {Scale} args.scale scale function of the rug.
 * @param {Number} [args.tickLength=5] length of the rug's ticks.
 * @param {Array} [args.colors=schemeCategory10] color scheme of the rug ticks.
 * @param {String} [args.orientation='horizontal'] orientation of the rug, either vertical or horizontal.
 * @param {Number} [args.left=0] left margin of the rug.
 * @param {Number} [args.top=0] top margin of the rug.
 */
export default class Rug {
  rugObject = null
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

  /**
   * Mount the rug to the given node.
   *
   * @param {Object} svg d3 node to mount the rug to.
   * @returns {void}
   */
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
