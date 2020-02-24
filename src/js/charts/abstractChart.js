import { isArrayOfArrays, isArrayOfObjectsOrEmpty, getWidth, getHeight, raiseContainerError, targetRef } from '../misc/utility'
import { select } from 'd3-selection'
import Scale from '../components/scale'

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
  margin = { top: 10, left: 60, right: 20, bottom: 30 }
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
    yScale
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

    // set up main container
    this.container = this.svg
      .append('g')
      .attr('transform', `translate(${this.plotLeft},${this.plotTop})`)
  }

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

  setViewboxForScaling () {
    // we need to reconsider how we handle automatic scaling
    this.svg.attr('viewBox', `0 0 ${this.width} ${this.height}`)
    if (this.isFullWidth || this.isFullHeight) {
      this.svg.attr('preserveAspectRatio', 'xMinYMin meet')
    }
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
