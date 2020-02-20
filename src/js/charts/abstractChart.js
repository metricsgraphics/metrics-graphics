import { isArrayOfArrays, isArrayOfObjectsOrEmpty, getWidth, getHeight, raiseContainerError, targetRef } from '../misc/utility'
import { select } from 'd3-selection'
import XScale from '../scale/xScale'
import YScale from '../scale/yScale'

export default class AbstractChart {
  // base chart fields
  data = null
  markers = []
  target = null
  svg = null

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
  margin = { top: 0, left: 0, right: 0, bottom: 0 }
  buffer = 0

  // data type flags
  isSingleObject = false
  isArrayOfObjects = false
  isArrayOfArrays = false
  isNestedArrayOfArrays = false
  isNestedArrayOfObjects = false

  constructor (args) {
    // check that at least some data was specified
    if (!args.data || !args.data.length) return console.error('no data specified')

    // check that the target is defined
    if (!args.target || args.target === '') return console.error('no target specified')

    // set parameters
    this.data = args.data
    this.target = args.target
    this.markers = args.markers ?? this.markers

    // convert string accessors to functions if necessary
    this.xAccessor = typeof xAccessor === 'string'
      ? d => d[args.xAccessor] : args.xAccessor
    this.yAccessor = typeof yAccessor === 'string'
      ? d => d[args.yAccessor] : args.yAccessor
    if (args.margin) this.margin = args.margin
    this.buffer = args.buffer ?? this.buffer

    // compute dimensions
    this.width = this.isFullWidth ? getWidth(this.target) : parseInt(args.width)
    this.height = this.isFullHeight ? getHeight(this.target) : parseInt(args.height)

    // normalize color and colors arguments
    this.colors = args.color
      ? Array.isArray(args.color) ? args.color : [args.color]
      : Array.isArray(args.colors) ? args.colors : [args.colors]

    this.setDataTypeFlags()

    // attach base elements to svg
    this.addSvgIfItDoesntExist()
    this.addClipPathForPlotArea()
    this.setViewboxForScaling()

    // set up scale functions
    this.xScale = args.xScale ?? new XScale(args)
    this.yScale = args.yScale ?? new YScale(args)
  }

  setDataTypeFlags () {
    // case 1: data is just one object, e.g. for bar chart
    if (!Array.isArray(this.data)) {
      this.singleObject = true
      return
    }

    // case 2: data is array of objects
    if (!isArrayOfArrays(this.data)) {
      this.arrayOfObjects = true
      return
    }

    // case 3: data is at least array of arrays
    this.arrayOfArrays = true

    // case 4: nested array of objects
    this.nestedArrayOfObjects = this.data.every(da => isArrayOfObjectsOrEmpty(da))

    // case 5: nested array of arrays
    this.nestedArrayOfArrays = this.data.every(da => isArrayOfArrays(da))
  }

  addSvgIfItDoesntExist () {
    const container = select(this.target)
    raiseContainerError(container, this.target)
    const svg = select(this.target).select('svg')
    this.svg = (!svg || svg.empty())
      ? select(this.target)
        .append('svg')
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

  getBottom () { return this.height - this.margin.bottom }
  getRight () { return this.width - this.margin.right }

  // returns the pixel location of the respective side of the plot area.
  getPlotBottom () { return this.getBottom() - this.buffer }
  getPlotTop () { return this.margin.top + this.buffer }
  getPlotLeft () { return this.margin.left + this.buffer }
  getPlotRight () { return this.getRight() - this.buffer }
}
