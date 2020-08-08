import constants from '../misc/constants'
import { axisTop, axisLeft, axisRight, axisBottom } from 'd3-axis'
import { format } from 'd3-format'
import { timeFormat } from 'd3-time-format'
import Scale from './scale'
import { TextFunction, LineD3Selection, TextD3Selection, SvgD3Selection, GD3Selection } from '../misc/typings'

const DEFAULT_VERTICAL_OFFSET = 35
const DEFAULT_HORIZONTAL_OFFSET = 50

type NumberFormatFunction = (x: number) => string
type DateFormatFunction = (x: Date) => string
type FormatFunction = NumberFormatFunction | DateFormatFunction

enum AxisOrientation {
  TOP = 'top',
  BOTTOM = 'bottom',
  RIGHT = 'right',
  LEFT = 'left'
}

enum AxisFormat {
  DATE = 'date',
  NUMBER = 'number',
  PERCENTAGE = 'percentage'
}

export interface IAxis {
  /** scale of the axis */
  scale: Scale

  /** buffer used by the chart, necessary to compute margins */
  buffer: number

  /** orientation of the axis */
  orientation?: AxisOrientation

  /** optional label to place beside the axis */
  label?: string

  /** offset between label and axis */
  labelOffset?: number

  /** translation from the top of the chart's box to render the axis */
  top?: number

  /** translation from the left of the chart's to render the axis */
  left?: number

  /** can be 1) a function to format a given tick or a specifier, or 2) one of the available standard formatting types (date, number, percentage) or a string for d3-format */
  tickFormat?: TextFunction | AxisFormat | string

  /** number of ticks to render, defaults to 3 for vertical and 6 for horizontal axes */
  tickCount?: number

  /** whether or not to render a compact version of the axis (clamps the main axis line at the outermost ticks) */
  compact?: boolean

  /** prefix for tick labels */
  prefix?: string

  /** suffix for tick labels */
  suffix?: string

  /** overwrite d3's default tick lengths */
  tickLength?: number

  /** draw extended ticks into the graph (used to make a grid) */
  extendedTicks?: boolean

  /** if extended ticks are used, this parameter specifies the inner length of ticks */
  height?: number
}

export default class Axis {
  label = ''
  labelOffset = 0
  top = 0
  left = 0
  scale: Scale
  orientation = AxisOrientation.BOTTOM
  axisObject: any
  compact = false
  extendedTicks = false
  buffer = 0
  height = 0
  prefix = ''
  suffix = ''

  constructor({
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
  }: IAxis) {
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
    this.extendedTicks = extendedTicks ?? this.extendedTicks
    this.setLabelOffset(labelOffset)

    this.setupAxisObject()

    // set or compute tickFormat
    if (tickFormat) this.tickFormat = tickFormat
    this.tickCount = tickCount ?? (this.isVertical ? 3 : 6)
  }

  /**
   * Set the label offset.
   *
   * @param labelOffset offset of the label.
   */
  setLabelOffset(labelOffset?: number): void {
    this.labelOffset =
      typeof labelOffset !== 'undefined'
        ? labelOffset
        : this.isVertical
        ? DEFAULT_HORIZONTAL_OFFSET
        : DEFAULT_VERTICAL_OFFSET
  }

  /**
   * Set up the main axis object.
   */
  setupAxisObject(): void {
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
   * @returns that mounts the domain when called.
   */
  domainObject() {
    return (g: GD3Selection): LineD3Selection =>
      g
        .append('line')
        .classed('domain', true)
        .attr('x1', this.isVertical ? 0.5 : this.compact ? this.buffer : 0)
        .attr('x2', this.isVertical ? 0.5 : this.compact ? this.scale.range[1] : this.scale.range[1] + 2 * this.buffer)
        .attr('y1', this.isVertical ? (this.compact ? this.top + 0.5 : 0.5) : 0)
        .attr(
          'y2',
          this.isVertical ? (this.compact ? this.scale.range[0] + 0.5 : this.scale.range[0] + 2 * this.buffer + 0.5) : 0
        )
  }

  /**
   * Get the label object call function.
   * @returns {Function} that mounts the label when called.
   */
  labelObject(): (node: GD3Selection) => TextD3Selection {
    const value = Math.abs(this.scale.range[0] - this.scale.range[1]) / 2
    const xValue = this.isVertical ? -this.labelOffset : value
    const yValue = this.isVertical ? value : this.labelOffset
    return (g) =>
      g
        .append('text')
        .attr('x', xValue)
        .attr('y', yValue)
        .attr('text-anchor', 'middle')
        .classed('label', true)
        .attr('transform', this.isVertical ? `rotate(${-90} ${xValue},${yValue})` : '')
        .text(this.label)
  }

  get isVertical(): boolean {
    return [constants.axisOrientation.left, constants.axisOrientation.right].includes(this.orientation)
  }
  get innerLeft(): number {
    return this.isVertical ? 0 : this.buffer
  }
  get innerTop(): number {
    return this.isVertical ? this.buffer : 0
  }
  get tickAttribute(): string {
    return this.isVertical ? 'x1' : 'y1'
  }
  get extendedTickLength(): number {
    const factor = this.isVertical ? 1 : -1
    return factor * (this.height + 2 * this.buffer)
  }

  /**
   * Mount the axis to the given d3 node.
   * @param svg d3 node.
   */
  mountTo(svg: SvgD3Selection): void {
    // set up axis container
    const axisContainer = svg
      .append('g')
      .attr('transform', `translate(${this.left},${this.top})`)
      .classed('mg-axis', true)

    // if no extended ticks are used, draw the domain line
    if (!this.extendedTicks) axisContainer.call(this.domainObject())

    // mount axis but remove default-generated domain
    axisContainer
      .append('g')
      .attr('transform', `translate(${this.innerLeft},${this.innerTop})`)
      .call(this.axisObject)
      .call((g) => g.select('.domain').remove())

    // if necessary, make ticks longer
    if (this.extendedTicks) {
      axisContainer.call((g) =>
        g.selectAll('.tick line').attr(this.tickAttribute, this.extendedTickLength).attr('opacity', 0.3)
      )
    }

    // if necessary, add label
    if (this.label !== '') axisContainer.call(this.labelObject())
  }

  /**
   * Compute the time formatting function based on the time domain.
   * @returns d3 function for formatting time.
   */
  diffToTimeFormat(): FormatFunction {
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
   * @param formatType abstract format to be converted (number, date, percentage)
   * @returns d3 formatting function for the given abstract number type.
   */
  stringToFormat(formatType: AxisFormat | string): FormatFunction {
    switch (formatType) {
      case constants.axisFormat.number:
        return this.isVertical ? format('~s') : format('')
      case constants.axisFormat.date:
        return this.diffToTimeFormat()
      case constants.axisFormat.percentage:
        return format('.0%')
      default:
        return format(formatType)
    }
  }

  set tickFormat(tickFormat: FormatFunction | string) {
    // if tickFormat is a function, apply it directly
    const formatFunction = typeof tickFormat === 'function' ? tickFormat : this.stringToFormat(tickFormat)

    this.axisObject.tickFormat((d: any) => `${this.prefix}${formatFunction(d)}${this.suffix}`)
  }

  set tickCount(tickCount: number) {
    this.axisObject.ticks(tickCount)
  }
  set tickLength(length: number) {
    this.axisObject.tickSize(length)
  }
}
