import { select, extent, max, brush as d3brush, brushX, brushY } from 'd3'
import { randomId, makeAccessorFunction } from '../misc/utility'
import Scale from '../components/scale'
import Axis, { IAxis, AxisOrientation } from '../components/axis'
import Tooltip from '../components/tooltip'
import Legend from '../components/legend'
import constants from '../misc/constants'
import Point, { IPoint } from '../components/point'
import {
  SvgD3Selection,
  AccessorFunction,
  Margin,
  GenericD3Selection,
  BrushType,
  DomainObject,
  Domain,
  LegendSymbol
} from '../misc/typings'

type TooltipFunction = (datapoint: any) => string

export interface IAbstractChart {
  /** data that is to be visualized */
  data: Array<any>

  /** DOM node to which the graph will be mounted (D3 selection or D3 selection specifier) */
  target: string

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
  xScale?: Partial<Scale>

  /** overwrite parameters of the auto-generated y scale */
  yScale?: Partial<Scale>

  /** overwrite parameters of the auto-generated x axis */
  xAxis?: Partial<Axis>

  /** overwrite parameters of the auto-generated y axis */
  yAxis?: Partial<Axis>

  /** whether or not to show a tooltip */
  showTooltip?: boolean

  /** generate a custom tooltip string */
  tooltipFunction?: (datapoint: any) => string

  /** names of the sub-arrays of data, used as legend labels */
  legend?: Array<string>

  /** add an optional brush */
  brush?: BrushType

  /** custom domain computations */
  computeDomains?: () => DomainObject
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
  svg?: GenericD3Selection
  content?: GenericD3Selection
  container?: GenericD3Selection

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
  tooltipFunction?: TooltipFunction
  tooltip?: Tooltip
  legend?: Array<string>

  // dimensions
  width: number
  height: number

  // margins
  margin: Margin
  buffer: number

  // brush
  brush?: BrushType
  idleDelay = 350
  idleTimeout: unknown

  constructor({
    data,
    target,
    markers,
    baselines,
    xAccessor,
    yAccessor,
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
    brush,
    computeDomains
  }: IAbstractChart) {
    // convert string accessors to functions if necessary
    this.xAccessor = makeAccessorFunction(xAccessor ?? 'date')
    this.yAccessor = makeAccessorFunction(yAccessor ?? 'value')

    // set parameters
    this.data = data
    this.target = select(target)
    this.markers = markers ?? []
    this.baselines = baselines ?? []
    this.legend = legend ?? this.legend
    this.brush = brush ?? undefined
    this.xAxisParams = xAxis ?? this.xAxisParams
    this.yAxisParams = yAxis ?? this.yAxisParams
    this.showTooltip = showTooltip ?? true
    this.tooltipFunction = tooltipFunction

    this.margin = margin ?? { top: 10, left: 60, right: 20, bottom: 40 }
    this.buffer = buffer ?? 10

    // set unique id for chart
    this.id = randomId()

    // compute dimensions
    this.width = width
    this.height = height

    // normalize color and colors arguments
    this.colors = colors ?? constants.defaultColors

    // clear target
    this.target.selectAll('*').remove()

    // attach base elements to svg
    this.mountSvg()

    // set up scales
    this.xScale = new Scale({ range: [0, this.innerWidth], ...xScale })
    this.yScale = new Scale({ range: [this.innerHeight, 0], ...yScale })

    // compute domains and set them
    const { x, y } = computeDomains ? computeDomains() : this.computeDomains()
    this.xDomain = x
    this.yDomain = y
    this.xScale.domain = x
    this.yScale.domain = y

    this.abstractRedraw()
  }

  /**
   * Draw the abstract chart.
   */
  abstractRedraw(): void {
    // if not drawn yet, abort
    if (!this.content) return

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
   */
  abstract redraw(): void

  mountBrush(whichBrush?: BrushType): void {
    // if no brush is specified, there's nothing to mount
    if (!whichBrush) return

    // brush can only be mounted after content is set
    if (!this.content || !this.container) {
      console.error('error: content not set yet')
      return
    }

    const brush = whichBrush === BrushType.X ? brushX() : whichBrush === BrushType.Y ? brushY() : d3brush()
    brush.on('end', ({ selection }) => {
      // if no content is set, do nothing
      if (!this.content) {
        console.error('error: content is not set yet')
        return
      }
      // compute domains and re-draw
      if (selection === null) {
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
          this.xScale.domain = [selection[0], selection[1]].map(this.xScale.scaleObject.invert)
        } else if (this.brush === 'y') {
          this.yScale.domain = [selection[0], selection[1]].map(this.yScale.scaleObject.invert)
        } else {
          this.xScale.domain = [selection[0][0], selection[1][0]].map(this.xScale.scaleObject.invert)
          this.yScale.domain = [selection[1][1], selection[0][1]].map(this.yScale.scaleObject.invert)
        }
        this.content.select('.brush').call((brush as any).move, null)
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
   */
  mountLegend(symbolType: LegendSymbol): void {
    if (!this.legend || !this.legend.length) return
    const legend = new Legend({
      legend: this.legend,
      colorScheme: this.colors,
      symbolType
    })
    legend.mountTo(this.target)
  }

  /**
   * Mount new x axis.
   *
   * @param xAxis object that can be used to overwrite parameters of the auto-generated x {@link Axis}.
   */
  mountXAxis(xAxis: Partial<IAxis>): void {
    // axis only mountable after content is mounted
    if (!this.content) {
      console.error('error: content needs to be mounted first')
      return
    }

    if (typeof xAxis?.show !== 'undefined' && !xAxis.show) return
    this.xAxis = new Axis({
      scale: this.xScale,
      orientation: AxisOrientation.BOTTOM,
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
   * @param yAxis object that can be used to overwrite parameters of the auto-generated y {@link Axis}.
   */
  mountYAxis(yAxis: Partial<IAxis>): void {
    // axis only mountable after content is mounted
    if (!this.content) {
      console.error('error: content needs to be mounted first')
      return
    }

    if (typeof yAxis?.show !== 'undefined' && !yAxis.show) return
    this.yAxis = new Axis({
      scale: this.yScale,
      orientation: AxisOrientation.LEFT,
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
   * @param showTooltip whether or not to show a tooltip.
   * @param tooltipFunction function that receives a data object and returns the string displayed as tooltip.
   */
  mountTooltip(showTooltip?: boolean, tooltipFunction?: TooltipFunction): void {
    // only mount of content is defined
    if (!this.content) {
      console.error('error: content is not defined yet')
      return
    }

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
   */
  mountContainer(): void {
    // content needs to be mounted first
    if (!this.content) {
      console.error('content needs to be mounted first')
      return
    }

    const width = max(this.xScale.range)
    const height = max(this.yScale.range)

    if (!width || !height) {
      console.error(`error: width or height is null (width: "${width}", height: "${height}")`)
      return
    }

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
      .attr('width', width)
      .attr('height', height)
  }

  /**
   * This method is called by the abstract chart constructor.
   * Append the local svg node to the specified target, if necessary.
   * Return existing svg node if it's already present.
   */
  mountSvg(): void {
    const svg = this.target.select('svg')

    // warn user if svg is not empty
    if (!svg.empty()) {
      console.warn('Warning: SVG is not empty. Rendering might be unnecessary.')
    }

    // clear svg
    svg.remove()

    this.svg = this.target.append('svg').classed('mg-graph', true).attr('width', this.width).attr('height', this.height)

    // prepare clip path
    this.svg.select('.mg-clip-path').remove()
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

    // append content
    this.content = this.svg.append('g').classed('mg-content', true)
  }

  /**
   * If needed, charts can implement data normalizations, which are applied when instantiating a new chart.
   * TODO this is currently unused
   */
  // abstract normalizeData(): void

  /**
   * Usually, the domains of the chart's scales depend on the chart type and the passed data, so this should usually be overwritten by chart implementations.
   * @returns domains for x and y axis as separate properties.
   */
  computeDomains(): DomainObject {
    const flatData = this.data.flat()
    const x = extent(flatData, this.xAccessor)
    const y = extent(flatData, this.yAccessor)
    return { x: x as [number, number], y: y as [number, number] }
  }

  /**
   * Set tick format of the x axis.
   */
  computeXAxisType(): void {
    // abort if no x axis is used
    if (!this.xAxis) {
      console.error('error: no x axis set')
      return
    }

    const flatData = this.data.flat()
    const xValue = this.xAccessor(flatData[0])

    if (xValue instanceof Date) {
      this.xAxis.tickFormat = 'date'
    } else if (Number(xValue) === xValue) {
      this.xAxis.tickFormat = 'number'
    }
  }

  /**
   * Set tick format of the y axis.
   */
  computeYAxisType(): void {
    // abort if no y axis is used
    if (!this.yAxis) {
      console.error('error: no y axis set')
      return
    }

    const flatData = this.data.flat()
    const yValue = this.yAccessor(flatData[0])

    if (yValue instanceof Date) {
      this.yAxis.tickFormat = constants.axisFormat.date
    } else if (Number(yValue) === yValue) {
      this.yAxis.tickFormat = constants.axisFormat.number
    }
  }

  generatePoint(args: Partial<IPoint>): Point {
    return new Point({
      ...args,
      xAccessor: this.xAccessor,
      yAccessor: this.yAccessor,
      xScale: this.xScale,
      yScale: this.yScale
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
