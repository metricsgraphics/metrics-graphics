import { isArrayOfArrays, isArrayOfObjectsOrEmpty, getWidth, getHeight, raiseContainerError, targetRef } from '../misc/utility'
import { select } from 'd3-selection'
import Scale from '../components/scale'
import Axis from '../components/axis'

export default class AbstractChart {
  // base chart fields
  data = null
  markers = []
  target = null
  svg = null
  container = null

  // accessors
  xAccessor = null
  yAccessor = null
  colors = []

  // scales
  xScale = null
  yScale = null

  // axes
  xAxis = null
  yAxis = null

  // dimensions
  width = 0
  height = 0
  isFullWidth = false
  isFullHeight = false

  // margins
  margin = { top: 10, left: 60, right: 20, bottom: 40 }
  buffer = 10

  // data type flags
  isSingleObject = false
  isArrayOfObjects = false
  isArrayOfArrays = false
  isNestedArrayOfArrays = false
  isNestedArrayOfObjects = false

  constructor ({
    data,
    target,
    markers,
    xAccessor,
    yAccessor,
    margin,
    buffer,
    width,
    height,
    color,
    colors,
    xScale,
    yScale,
    xAxis,
    yAxis
  }) {
    // check that at least some data was specified
    if (!data || !data.length) return console.error('no data specified')

    // check that the target is defined
    if (!target || target === '') return console.error('no target specified')

    // set parameters
    this.data = data
    this.target = target
    this.markers = markers ?? this.markers

    // convert string accessors to functions if necessary
    this.xAccessor = typeof xAccessor === 'string'
      ? d => d[xAccessor] : xAccessor
    this.yAccessor = typeof yAccessor === 'string'
      ? d => d[yAccessor] : yAccessor
    if (margin) this.margin = margin
    this.buffer = buffer ?? this.buffer

    // compute dimensions
    this.width = this.isFullWidth ? getWidth(this.target) : parseInt(width)
    this.height = this.isFullHeight ? getHeight(this.target) : parseInt(height)

    // normalize color and colors arguments
    this.colors = color
      ? Array.isArray(color) ? color : [color]
      : Array.isArray(colors) ? colors : [colors]

    this.setDataTypeFlags()

    // attach base elements to svg
    this.addSvgIfItDoesntExist()
    this.addClipPathForPlotArea()
    this.setViewboxForScaling()

    // set up scales
    this.xScale = new Scale({
      range: [0, this.innerWidth],
      ...xScale
    })
    this.yScale = new Scale({
      range: [this.innerHeight, 0],
      ...yScale
    })

    // normalize data if necessary
    this.normalizeData()
    this.computeDomains()

    // set up axes if not disabled
    const hideX = xAxis && typeof xAxis.show !== 'undefined' && !xAxis.show
    const hideY = yAxis && typeof yAxis.show !== 'undefined' && !yAxis.show
    this.xAxis = !hideX ? new Axis({
      scale: this.xScale,
      orientation: 'bottom',
      top: this.bottom,
      left: this.left,
      height: this.innerHeight,
      buffer: this.buffer,
      ...xAxis
    }) : null
    this.yAxis = !hideY ? new Axis({
      scale: this.yScale,
      orientation: 'left',
      top: this.top,
      left: this.left,
      height: this.innerWidth,
      buffer: this.buffer,
      ...yAxis
    }) : null

    // set up main container
    this.container = this.svg
      .append('g')
      .attr('transform', `translate(${this.plotLeft},${this.plotTop})`)

    // attach axes
    if (this.xAxis) this.xAxis.mountTo(this.svg)
    if (this.yAxis) this.yAxis.mountTo(this.svg)
  }

  /**
   * This method is called by the abstract chart constructor.
   * In order to simplify parsing of passed data, set flags specifying what types of data we're dealing with.
   */
  setDataTypeFlags () {
    // case 1: data is just one object, e.g. for bar chart
    if (!Array.isArray(this.data)) {
      this.isSingleObject = true
      return
    }

    // case 2: data is array of objects
    if (!isArrayOfArrays(this.data)) {
      this.isArrayOfObjects = true
      return
    }

    // case 3: data is at least array of arrays
    this.isArrayOfArrays = true

    // case 4: nested array of objects
    this.isNestedArrayOfObjects = this.data.every(da => isArrayOfObjectsOrEmpty(da))

    // case 5: nested array of arrays
    this.isNestedArrayOfArrays = this.data.every(da => isArrayOfArrays(da))
  }

  /**
   * This method is called by the abstract chart constructor.
   * Append the local svg node to the specified target, if necessary.
   * Return existing svg node if it's already present.
   */
  addSvgIfItDoesntExist () {
    const container = select(this.target)
    raiseContainerError(container, this.target)
    const svg = select(this.target).select('svg')
    this.svg = (!svg || svg.empty())
      ? select(this.target)
        .append('svg')
        .classed('mg-graph', true)
        .attr('width', this.width)
        .attr('height', this.height)
      : svg
  }

  /**
   * This method is called by the abstract chart constructor.
   * Set up the clipping path to allow zooming later.
   */
  addClipPathForPlotArea () {
    this.svg.selectAll('.mg-clip-path').remove()
    this.svg.append('defs')
      .attr('class', 'mg-clip-path')
      .append('clipPath')
      .attr('id', 'mg-plot-window-' + targetRef(this.target))
      .append('svg:rect')
      .attr('x', this.margin.left)
      .attr('y', this.margin.top)
      .attr('width', this.width - this.margin.left - this.margin.right - this.buffer)
      .attr('height', this.height - this.margin.top - this.margin.bottom - this.buffer + 1)
  }

  /**
   * This method is called by the abstract chart constructor.
   * Set up the svg's viewbox to allow making the chart responsive.
   */
  setViewboxForScaling () {
    // we need to reconsider how we handle automatic scaling
    this.svg.attr('viewBox', `0 0 ${this.width} ${this.height}`)
    if (this.isFullWidth || this.isFullHeight) {
      this.svg.attr('preserveAspectRatio', 'xMinYMin meet')
    }
  }

  /**
   * If needed, charts can implement data normalizations, which are applied when instantiating a new chart.
   */
  normalizeData () {}

  /**
   * Usually, the domains of the chart's scales depend on the chart type and the passed data, so this should usually be overwritten by chart implementations.
   */
  computeDomains () {
    this.xScale.domain = [0, 1]
    this.yScale.domain = [0, 1]
  }

  get top () { return this.margin.top }
  get left () { return this.margin.left }
  get bottom () { return this.height - this.margin.bottom }
  get right () { return this.width - this.margin.right }

  // returns the pixel location of the respective side of the plot area.
  get plotBottom () { return this.bottom - this.buffer }
  get plotTop () { return this.top + this.buffer }
  get plotLeft () { return this.left + this.buffer }
  get plotRight () { return this.right - this.buffer }

  get innerWidth () { return this.width - this.margin.left - this.margin.right - 2 * this.buffer }
  get innerHeight () { return this.height - this.margin.top - this.margin.bottom - 2 * this.buffer }
}
