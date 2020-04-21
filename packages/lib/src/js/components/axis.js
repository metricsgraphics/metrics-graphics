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
  prefix = ''
  suffix = ''

  /**
   * Instantiate a new axis.
   *
   * @param {Scale} scale scale of the axis.
   * @param {Number} buffer buffer used by the chart. Necessary to compute margins.
   * @param {String} [orientation='bottom'] orientation of the axis. Can be top, bottom, left, right.
   * @param {String} [label] optional label to place beside the axis.
   * @param {Number} [labelOffset] offset between label and axis.
   * @param {Number} [top=0] translation from the top of the chart's box to render the axis.
   * @param {Number} [left=0] translation from the left of the chart's to render the axis.
   * @param {String | Function} [tickFormat] can be 1) a function to format a given tick or a specifier, or 2) one of the available standard formatting types (date, number, percentage) or a string for d3-format.
   * @param {Number} [tickCount] number of ticks to render. Defaults to 3 for vertical and 6 for horizontal axes.
   * @param {Boolean} [compact=false] whether or not to render a compact version of the axis (clamps the main axis line at the outermost ticks).
   * @param {String} [prefix=''] prefix for tick labels.
   * @param {String} [suffix=''] suffix for tick labels.
   * @param {Number} [tickLength] overwrite d3's default tick lengths.
   * @param {Boolean} [extendedTicks=false] draw extended ticks into the graph (used to make a grid).
   * @param {Number} [height=0] if extended ticks are used, this parameter specifies the inner length of ticks.
   */
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
    if (typeof tickLength !== 'undefined') this.tickLength = tickLength
    this.extendedTicks = extendedTicks
    this.labelOffset = typeof labelOffset !== 'undefined'
      ? labelOffset
      : this.isVertical
        ? DEFAULT_HORIZONTAL_OFFSET
        : DEFAULT_VERTICAL_OFFSET

    this.setupAxisObject()

    // set or compute tickFormat
    if (tickFormat) this.tickFormat = tickFormat
    this.tickCount = tickCount ?? (this.isVertical ? 3 : 6)
  }

  /**
   * Set up the main axis object.
   * @returns {void}
   */
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

  /**
   * Get the domain object call function.
   * @returns {Function} that mounts the domain when called.
   */
  domainObject () {
    return g => g
      .append('line')
      .classed('domain', true)
      .attr('x1', this.isVertical ? 0.5 : this.compact ? this.buffer : 0)
      .attr('x2', this.isVertical ? 0.5 : this.compact ? this.scale.range[1] : this.scale.range[1] + 2 * this.buffer)
      .attr('y1', this.isVertical ? this.compact ? this.top + 0.5 : 0.5 : 0)
      .attr('y2', this.isVertical ? this.compact ? this.scale.range[0] + 0.5 : this.scale.range[0] + 2 * this.buffer + 0.5 : 0)
  }

  /**
   * Get the label object call function.
   * @returns {Function} that mounts the label when called.
   */
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

  get isVertical () { return [constants.axisOrientation.left, constants.axisOrientation.right].includes(this.orientation) }
  get innerLeft () { return this.isVertical ? 0 : this.buffer }
  get innerTop () { return this.isVertical ? this.buffer : 0 }
  get tickAttribute () { return this.isVertical ? 'x1' : 'y1' }
  get extendedTickLength () {
    const factor = this.isVertical ? 1 : -1
    return factor * (this.height + 2 * this.buffer)
  }

  /**
   * Mount the axis to the given d3 node.
   * @param {Object} svg d3 node.
   * @returns {void}
   */
  mountTo (svg) {
    // set up axis container
    const axisContainer = svg.append('g')
      .attr('transform', `translate(${this.left},${this.top})`)
      .classed('mg-axis', true)

    // if no extended ticks are used, draw the domain line
    if (!this.extendedTicks) axisContainer.call(this.domainObject())

    // mount axis but remove default-generated domain
    axisContainer
      .append('g')
      .attr('transform', `translate(${this.innerLeft},${this.innerTop})`)
      .call(this.axisObject)
      .call(g => g.select('.domain').remove())

    // if necessary, make ticks longer
    if (this.extendedTicks) {
      axisContainer.call(g => g
        .selectAll('.tick line')
        .attr(this.tickAttribute, this.extendedTickLength)
        .attr('opacity', 0.3)
      )
    }

    // if necessary, add label
    if (this.label !== '') axisContainer.call(this.labelObject())
  }

  /**
   * Compute the time formatting function based on the time domain.
   * @returns {Function} d3 function for formatting time.
   */
  diffToTimeFormat () {
    const diff = Math.abs(this.scale.domain[1] - this.scale.domain[0]) / 1000

    const millisecondDiff = diff < 1
    const secondDiff = diff < 60
    const dayDiff = diff / (60 * 60) < 24
    const fourDaysDiff = diff / (60 * 60) < 24 * 4
    const manyDaysDiff = diff / (60 * 60 * 24) < 60
    const manyMonthsDiff = diff / (60 * 60 * 24) < 365

    return millisecondDiff
      ? timeFormat('%M:%S.%L')
      : secondDiff
        ? timeFormat('%M:%S')
        : dayDiff
          ? timeFormat('%H:%M')
          : fourDaysDiff || manyDaysDiff || manyMonthsDiff
            ? timeFormat('%b %d')
            : timeFormat('%Y')
  }

  /**
   * Get the d3 number formatting function for an abstract number type.
   *
   * @param {String} formatType abstract format to be converted (number, date, percentage)
   * @returns {Function} d3 formatting function for the given abstract number type.
   */
  stringToFormat (formatType) {
    switch (formatType) {
      case constants.axisFormat.number: return this.isVertical ? format('~s') : format('')
      case constants.axisFormat.date: return this.diffToTimeFormat()
      case constants.axisFormat.percentage: return format('.0%')
      default: return format(formatType)
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
