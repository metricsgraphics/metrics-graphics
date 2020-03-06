import constants from '../misc/constants'
import { axisTop, axisLeft, axisRight, axisBottom } from 'd3-axis'
import { format } from 'd3-format'
import { timeFormat } from 'd3-time-format'

const DEFAULT_VERTICAL_OFFSET = 35
const DEFAULT_HORIZONTAL_OFFSET = 50

export default class Axis {
  label = ''
  labelOffset = null
  top = 0
  left = 0
  scale = null
  orientation = 'bottom'
  axisObject = null
  compact = false
  buffer = 0
  height = 0
  isVertical = false
  prefix = ''
  suffix = ''

  constructor ({
    orientation,
    label,
    labelOffset,
    top,
    left,
    height,
    scale,
    tickFormat,
    tickCount,
    compact,
    buffer,
    prefix,
    suffix,
    tickLength,
    extendedTicks
  }) {
    // cry if no scale is set
    if (!scale) throw new Error('an axis needs a scale')

    this.scale = scale
    this.label = label ?? this.label
    this.buffer = buffer ?? this.buffer
    this.top = top ?? this.top
    this.left = left ?? this.left
    this.height = height ?? this.height
    this.orientation = orientation ?? this.orientation
    this.compact = compact ?? this.compact
    this.prefix = prefix ?? this.prefix
    this.suffix = suffix ?? this.suffix
    this.isVertical = [constants.axisOrientation.left, constants.axisOrientation.right].includes(this.orientation)
    this.extendedTicks = extendedTicks
    this.labelOffset = typeof labelOffset !== 'undefined'
      ? labelOffset
      : this.isVertical
        ? DEFAULT_HORIZONTAL_OFFSET
        : DEFAULT_VERTICAL_OFFSET

    this.setupAxisObject()

    // set or compute tickFormat
    if (tickFormat) {
      this.tickFormat = typeof tickFormat === 'string'
        ? format(tickFormat)
        : tickFormat
    }
    this.tickCount = tickCount ?? (this.isVertical ? 3 : 6)

    // set tick length if necessary
    if (typeof tickLength !== 'undefined') this.tickLength = tickLength
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

  labelObject () {
    const value = Math.abs(this.scale.range[0] - this.scale.range[1]) / 2
    const xValue = this.isVertical ? -this.labelOffset : value
    const yValue = this.isVertical ? value : this.labelOffset
    return g => g
      .append('text')
      .attr('x', xValue)
      .attr('y', yValue)
      .attr('text-anchor', 'middle')
      .classed('label', true)
      .attr('transform', this.isVertical ? `rotate(${-90} ${xValue},${yValue})` : undefined)
      .text(this.label)
  }

  mountTo (svg) {
    const innerLeft = this.isVertical ? 0 : this.buffer
    const innerTop = this.isVertical ? this.buffer : 0
    const axisContainer = svg.append('g')
      .attr('transform', `translate(${this.left},${this.top})`)
      .classed('mg-axis', true)
    if (!this.extendedTicks) {
      axisContainer.call(this.domainObject())
    }
    axisContainer
      .append('g')
      .attr('transform', `translate(${innerLeft},${innerTop})`)
      .call(this.axisObject)
      .call(g => g.select('.domain').remove())

    // if necessary, make ticks longer
    if (this.extendedTicks) {
      // compute attribute
      const attribute = this.isVertical ? 'x1' : 'y1'
      const factor = this.isVertical ? 1 : -1
      axisContainer.call(g => g
        .selectAll('.tick line')
        .attr(attribute, factor * (this.height + 2 * this.buffer))
        .attr('opacity', 0.3)
      )
    }

    // if necessary, add label
    if (this.label !== '') axisContainer.call(this.labelObject())
  }

  // computation functions for time-based axis formats
  diffToTimeFormat () {
    const diff = Math.abs(this.scale.domain[1] - this.scale.domain[0]) / 1000

    const millisecondDiff = diff < 1
    const secondDiff = diff < 60
    const dayDiff = diff / (60 * 60) < 24
    const fourDaysDiff = diff / (60 * 60) < 24 * 4
    const manyDaysDiff = diff / (60 * 60 * 24) < 60
    const manyMonthsDiff = diff / (60 * 60 * 24) < 365

    if (millisecondDiff) return timeFormat('%M:%S.%L')
    else if (secondDiff) return timeFormat('%M:%S')
    else if (dayDiff) return timeFormat('%H:%M')
    else if (fourDaysDiff || manyDaysDiff) return timeFormat('%b %d')
    else if (manyMonthsDiff) return timeFormat('%b %d')
    else return timeFormat('%Y')
  }

  stringToFormat (formatType) {
    switch (formatType) {
      case constants.axisFormat.number: return this.isVertical ? format('~s') : format('')
      case constants.axisFormat.date: return this.diffToTimeFormat()
      case constants.axisFormat.percentage: return format('.0%')
      default: return format('')
    }
  }

  set tickFormat (tickFormat) {
    // if tickFormat is a function, apply it directly
    const formatFunction = typeof tickFormat === 'function'
      ? tickFormat
      : this.stringToFormat(tickFormat)

    this.axisObject.tickFormat(d => `${this.prefix}${formatFunction(d)}${this.suffix}`)
  }

  set tickCount (tickCount) { this.axisObject.ticks(tickCount) }
  set tickLength (length) { this.axisObject.tickSize(length) }
}
