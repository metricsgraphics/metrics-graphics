import constants from '../misc/constants'
import { axisTop, axisLeft, axisRight, axisBottom } from 'd3-axis'
import { format } from 'd3-format'

export default class Axis {
  label = ''
  top = 0
  left = 0
  scale = null
  orientation = 'bottom'
  axisObject = null
  compact = false
  buffer = 0
  isVertical = false

  constructor ({
    orientation,
    label,
    top,
    left,
    scale,
    tickFormat,
    tickCount,
    compact,
    buffer
  }) {
    console.log('setting up axis: ', arguments)

    // cry if no scale is set
    if (!scale) throw new Error('an axis needs a scale')

    this.scale = scale
    this.label = label ?? this.label
    this.buffer = buffer ?? this.buffer
    this.top = top ?? this.top
    this.left = left ?? this.left
    this.orientation = orientation ?? this.orientation
    this.compact = compact ?? this.compact
    this.isVertical = [constants.axisOrientation.left, constants.axisOrientation.right].includes(this.orientation)

    this.setupAxisObject()

    // set or compute tickFormat
    this.tickFormat = tickFormat ?? format('.0f') // TODO
    this.tickCount = tickCount ?? (this.isVertical ? 3 : 6)
  }

  setupAxisObject () {
    switch (this.orientation) {
      case constants.axisOrientation.top:
        this.axisObject = axisTop(this.scale.scaleObject)
        break
      case constants.axisOrientation.left:
        this.axisObject = axisLeft(this.scale.scaleObject)
        break
      case constants.axisOrientation.right:
        this.axisObject = axisRight(this.scale.scaleObject)
        break
      default:
        this.axisObject = axisBottom(this.scale.scaleObject)
        break
    }
  }

  domainObject () {
    let x1 = 0
    let y1 = 0
    let x2 = 0
    let y2 = 0
    if (this.isVertical) {
      x1 = 0.5
      x2 = 0.5
      y1 = this.compact ? this.top + 0.5 : 0.5
      y2 = this.compact
        ? this.scale.range[0] + 0.5
        : this.scale.range[0] + 2 * this.buffer + 0.5
    } else {
      x1 = this.compact ? this.buffer : 0
      x2 = this.compact
        ? this.scale.range[1]
        : this.scale.range[1] + 2 * this.buffer
    }
    return g => g
      .append('line')
      .classed('domain', true)
      .attr('x1', x1)
      .attr('x2', x2)
      .attr('y1', y1)
      .attr('y2', y2)
  }

  mountTo (svg) {
    const innerLeft = this.isVertical ? 0 : this.buffer
    const innerTop = this.isVertical ? this.buffer : 0
    const axisContainer = svg.append('g')
      .attr('transform', `translate(${this.left},${this.top})`)
      .classed('mg-axis', true)
      .call(this.domainObject())
    axisContainer
      .append('g')
      .attr('transform', `translate(${innerLeft},${innerTop})`)
      .call(this.axisObject)
      .call(g => g.select('.domain').remove())
  }

  set tickFormat (tickFormat) { this.axisObject.tickFormat(tickFormat) }
  set tickCount (tickCount) { this.axisObject.ticks(tickCount) }
}
