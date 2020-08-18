import { getWidth, getHeight, randomId, makeAccessorFunction } from '../misc/utility'
import { select, event } from 'd3-selection'
import Scale from '../components/scale'
import Axis from '../components/axis'
import Tooltip from '../components/tooltip'
import Legend from '../components/legend'
import { extent, max } from 'd3-array'
import constants from '../misc/constants'
import Point, { IPoint } from '../components/point'
import { brush as d3brush, brushX, brushY } from 'd3-brush'
import {
  SvgD3Selection,
  AccessorFunction,
  Margin,
  GenericD3Selection,
  BrushType,
  DomainObject,
  Domain
} from '../misc/typings'

export interface IAbstractChart {
  /** data that is to be visualized */
  data: Array<any>

  /** DOM node to which the graph will be mounted (D3 selection or D3 selection specifier) */
  target: string | SvgD3Selection

  /** total width of the graph */
  width: number

  /** total height of the graph */
  height: number

  /** markers that should be added to the chart. Each marker object should be accessible through the xAccessor and contain a label field */
  markers?: Array<any>

  /** baselines that should be added to the chart. Each baseline object should be accessible through the yAccessor and contain a label field */
  baselines?: Array<any>

  /** either name of the field that contains the x value or function that receives a data object and returns its x value */
  xAccessor?: string | AccessorFunction

  /** either name of the field that contains the y value or function that receives a data object and returns its y value */
  yAccessor?: string | AccessorFunction

  /** margins of the visualization for labels */
  margin?: Margin

  /** amount of buffer between the axes and the graph */
  buffer?: number

  /** custom color scheme for the graph */
  colors?: Array<string>

  /** overwrite parameters of the auto-generated x scale */
  xScale?: Scale

  /** overwrite parameters of the auto-generated y scale */
  yScale?: Scale

  /** overwrite parameters of the auto-generated x axis */
  xAxis?: Axis

  /** overwrite parameters of the auto-generated y axis */
  yAxis?: Axis

  /** whether or not to show a tooltip */
  showTooltip?: boolean

  /** generate a custom tooltip string */
  tooltipFunction?: (datapoint: any) => string

  /** names of the sub-arrays of data, used as legend labels */
  legend?: Array<string>

  /** DOM node to which the legend will be mounted (D3 selection or D3 selection specifier) */
  legendTarget: string | GenericD3Selection

  /** add an optional brush */
  brush: BrushType
}

/**
 * This abstract chart class implements all functionality that is shared between all available chart types.
 */
export default abstract class AbstractChart {
  id: string

  // base chart fields
  data: Array<any>
  markers: Array<any>
  baselines: Array<any>
  target: SvgD3Selection
  svg?: SvgD3Selection
  content?: SvgD3Selection
  container?: SvgD3Selection

  // accessors
  xAccessor: AccessorFunction
  yAccessor: AccessorFunction
  colors: Array<string>

  // scales
  xDomain: Domain
  yDomain: Domain
  xScale: Scale
  yScale: Scale

  // axes
  xAxis?: Axis
  xAxisParams: any
  yAxis?: Axis
  yAxisParams: any

  // tooltip and legend stuff
  showTooltip: boolean
  tooltipFunction: (datapoint: any) => string
  tooltip?: Tooltip
  legend?: Legend
  legendTarget?: GenericD3Selection

  // dimensions
  width: number
  height: number

  // margins
  margin: Margin
  buffer: number

  // brush
  brush = false
  idleDelay = 350
  idleTimeout = null

  constructor({
    data,
    target,
    markers,
    baselines,
    xAccessor = 'date',
    yAccessor = 'value',
    margin,
    buffer,
    width,
    height,
    colors,
    xScale,
    yScale,
    xAxis,
    yAxis,
    showTooltip,
    tooltipFunction,
    legend,
    legendTarget,
    brush,
    ...custom
  }: IAbstractChart) {
    // set parameters
    this.data = data
    this.target = typeof target === 'string' ? select(target) : target
    this.markers = markers ?? []
    this.baselines = baselines ?? []
    this.legend = legend ?? this.legend
    this.legendTarget = legendTarget ?? this.legendTarget
    this.brush = brush ?? this.brush
    this.xAxisParams = xAxis ?? this.xAxisParams
    this.yAxisParams = yAxis ?? this.yAxisParams
    this.showTooltip = showTooltip ?? true
    this.tooltipFunction = tooltipFunction ?? this.tooltipFunction

    // convert string accessors to functions if necessary
    this.xAccessor = makeAccessorFunction(xAccessor)
    this.yAccessor = makeAccessorFunction(yAccessor)
    this.margin = margin ?? { top: 10, left: 60, right: 20, bottom: 40 }
    this.buffer = buffer ?? 10

    // set unique id for chart
    this.id = randomId()

    // compute dimensions
    this.width = getWidth(width, this.target)
    this.height = getHeight(height, this.target)

    // normalize color and colors arguments
    this.colors = color ? [color] : colors ? [colors] : constants.defaultColors

    // attach base elements to svg
    this.mountSvg()

    // set up scales
    this.xScale = new Scale({ range: [0, this.innerWidth], ...xScale })
    this.yScale = new Scale({ range: [this.innerHeight, 0], ...yScale })

    // normalize data if necessary
    this.normalizeData()

    // compute domains and set them
    const { x, y } = this.computeDomains(custom)
    this.xDomain = x
    this.yDomain = y
    this.xScale.domain = x
    this.yScale.domain = y

    this.abstractRedraw()
  }

  /**
   * Draw the abstract chart.
   * @returns {void}
   */
  abstractRedraw() {
    // clear
    this.content.selectAll('*').remove()

    // set up axes if not disabled
    this.mountXAxis(this.xAxisParams)
    this.mountYAxis(this.yAxisParams)

    // pre-attach tooltip text container
    this.mountTooltip(this.showTooltip, this.tooltipFunction)

    // set up main container
    this.mountContainer()
  }

  /**
   * Draw the actual chart.
   * This is meant to be overridden by chart implementations.
   * @returns {void}
   */
  redraw() {}

  mountBrush(whichBrush) {
    if (!whichBrush) return
    const brush = typeof whichBrush === 'string' ? (whichBrush === 'x' ? brushX() : brushY()) : d3brush()
    brush.on('end', () => {
      // compute domains and re-draw
      const s = event.selection
      if (s === null) {
        if (!this.idleTimeout) {
          this.idleTimeout = setTimeout(() => {
            this.idleTimeout = null
          }, 350)
          return
        }

        // set original domains
        this.xScale.domain = this.xDomain
        this.yScale.domain = this.yDomain
      } else {
        if (this.brush === 'x') {
          this.xScale.domain = [s[0], s[1]].map(this.xScale.scaleObject.invert)
        } else if (this.brush === 'y') {
          this.yScale.domain = [s[0], s[1]].map(this.yScale.scaleObject.invert)
        } else {
          this.xScale.domain = [s[0][0], s[1][0]].map(this.xScale.scaleObject.invert)
          this.yScale.domain = [s[1][1], s[0][1]].map(this.yScale.scaleObject.invert)
        }
        this.content.select('.brush').call(brush.move, null)
      }

      // re-draw abstract elements
      this.abstractRedraw()

      // re-draw specific chart
      this.redraw()
    })
    this.container.append('g').classed('brush', true).call(brush)
  }

  /**
   * Mount a new legend if necessary
   * @param {String} symbolType symbol type (circle, square, line)
   * @returns {void}
   */
  mountLegend(symbolType) {
    if (!this.legend || !this.legend.length || !this.legendTarget) return
    const legend = new Legend({
      legend: this.legend,
      colorScheme: this.colors,
      symbolType
    })
    legend.mountTo(this.legendTarget)
  }

  /**
   * Mount new x axis.
   *
   * @param {Object} [xAxis] object that can be used to overwrite parameters of the auto-generated x {@link Axis}.
   * @returns {void}
   */
  mountXAxis(xAxis) {
    if (typeof xAxis?.show !== 'undefined' && !xAxis.show) return
    this.xAxis = new Axis({
      scale: this.xScale,
      orientation: 'bottom',
      top: this.bottom,
      left: this.left,
      height: this.innerHeight,
      buffer: this.buffer,
      ...xAxis
    })
    if (!xAxis?.tickFormat) this.computeXAxisType()

    // attach axis
    if (this.xAxis) this.xAxis.mountTo(this.content)
  }

  /**
   * Mount new y axis.
   *
   * @param {Object} [yAxis] object that can be used to overwrite parameters of the auto-generated y {@link Axis}.
   * @returns {void}
   */
  mountYAxis(yAxis) {
    if (typeof yAxis?.show !== 'undefined' && !Axis.show) return
    this.yAxis = new Axis({
      scale: this.yScale,
      orientation: 'left',
      top: this.top,
      left: this.left,
      height: this.innerWidth,
      buffer: this.buffer,
      ...yAxis
    })
    if (!yAxis?.tickFormat) this.computeYAxisType()
    if (this.yAxis) this.yAxis.mountTo(this.content)
  }

  /**
   * Mount a new tooltip if necessary.
   *
   * @param {Boolean} [showTooltip] whether or not to show a tooltip.
   * @param {Function} [tooltipFunction] function that receives a data object and returns the string displayed as tooltip.
   * @returns {void}
   */
  mountTooltip(showTooltip, tooltipFunction) {
    if (typeof showTooltip !== 'undefined' && !showTooltip) return
    this.tooltip = new Tooltip({
      top: this.buffer,
      left: this.width - 2 * this.buffer,
      xAccessor: this.xAccessor,
      yAccessor: this.yAccessor,
      textFunction: tooltipFunction,
      colors: this.colors,
      legend: this.legend
    })
    this.tooltip.mountTo(this.content)
  }

  /**
   * Mount the main container.
   * @returns {void}
   */
  mountContainer() {
    this.container = this.content
      .append('g')
      .attr('transform', `translate(${this.left},${this.top})`)
      .attr('clip-path', `url(#mg-plot-window-${this.id})`)
      .append('g')
      .attr('transform', `translate(${this.buffer},${this.buffer})`)
    this.container
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('opacity', 0)
      .attr('pointer-events', 'all')
      .attr('width', max(this.xScale.range))
      .attr('height', max(this.yScale.range))
  }

  /**
   * This method is called by the abstract chart constructor.
   * Append the local svg node to the specified target, if necessary.
   * Return existing svg node if it's already present.
   * @returns {void}
   */
  mountSvg() {
    const svg = select(this.target).select('svg')
    this.svg =
      !svg || svg.empty()
        ? select(this.target)
            .append('svg')
            .classed('mg-graph', true)
            .attr('width', this.width)
            .attr('height', this.height)
        : svg

    // prepare clip path
    this.svg.selectAll('.mg-clip-path').remove()
    this.svg
      .append('defs')
      .attr('class', 'mg-clip-path')
      .append('clipPath')
      .attr('id', `mg-plot-window-${this.id}`)
      .append('svg:rect')
      .attr('width', this.width - this.margin.left - this.margin.right)
      .attr('height', this.height - this.margin.top - this.margin.bottom)

    // set viewbox
    this.svg.attr('viewBox', `0 0 ${this.width} ${this.height}`)
    if (this.isFullWidth || this.isFullHeight) {
      this.svg.attr('preserveAspectRatio', 'xMinYMin meet')
    }

    // append content
    this.content = this.svg.append('g').classed('mg-content', true)
  }

  /**
   * If needed, charts can implement data normalizations, which are applied when instantiating a new chart.
   */
  abstract normalizeData(): void

  /**
   * Usually, the domains of the chart's scales depend on the chart type and the passed data, so this should usually be overwritten by chart implementations.
   * @param params object of custom parameters for the specific chart type
   * @returns domains for x and y axis as separate properties.
   */
  computeDomains(params: any): DomainObject {
    const flatData = this.data.flat()
    const x = extent(flatData, this.xAccessor)
    const y = extent(flatData, this.yAccessor)
    return { x, y }
  }

  /**
   * Meant to be overwritten by chart implementations.
   * Set tick format of the x axis.
   */
  abstract computeXAxisType(): void

  /**
   * Meant to be overwritten by chart implementations.
   * Set tick format of the y axis.
   */
  abstract computeYAxisType(): void

  generatePoint(args: IPoint): Point {
    return new Point({
      xAccessor: this.xAccessor,
      yAccessor: this.yAccessor,
      xScale: this.xScale,
      yScale: this.yScale,
      ...args
    })
  }

  get top(): number {
    return this.margin.top
  }
  get left(): number {
    return this.margin.left
  }
  get bottom(): number {
    return this.height - this.margin.bottom
  }

  // returns the pixel location of the respective side of the plot area.
  get plotTop(): number {
    return this.top + this.buffer
  }
  get plotLeft(): number {
    return this.left + this.buffer
  }

  get innerWidth(): number {
    return this.width - this.margin.left - this.margin.right - 2 * this.buffer
  }
  get innerHeight(): number {
    return this.height - this.margin.top - this.margin.bottom - 2 * this.buffer
  }
}
