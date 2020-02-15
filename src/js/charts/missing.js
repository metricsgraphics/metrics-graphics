import { scaleLinear } from 'd3-scale'
import { getPlotLeft, getPlotRight, addG } from '../misc/utility'
import { line as d3line, area as d3area } from 'd3-shape'
import { select } from 'd3-selection'
import { initComputeWidth, initComputeHeight, raiseContainerError, removeSvgIfChartTypeHasChanged, addSvgIfItDoesntExist, adjustWidthAndHeightIfChanged, setViewboxForScaling } from '../common/init'
import { chartTitle } from '../common/chartTitle'
import { windowListeners } from '../common/windowListeners'

function missingAddText (svg, { missingText, width, height }) {
  svg.selectAll('.mg-missing-text').data([missingText])
    .enter().append('text')
    .attr('class', 'mg-missing-text')
    .attr('x', width / 2)
    .attr('y', height / 2)
    .attr('dy', '.50em')
    .attr('text-anchor', 'middle')
    .text(missingText)
}

function missingXScale (args) {
  args.scales.X = scaleLinear()
    .domain([0, args.data.length])
    .range([getPlotLeft(args), getPlotRight(args)])
  args.scaleFunctions.yf = ({ y }) => args.scales.Y(y)
}

function missingYScale (args) {
  args.scales.Y = scaleLinear()
    .domain([-2, 2])
    .range([args.height - args.bottom - args.buffer * 2, args.top])
  args.scaleFunctions.xf = ({ x }) => args.scales.X(x)
}

function makeFakeData (args) {
  const data = []
  for (let x = 1; x <= 50; x++) {
    data.push({ x, y: Math.random() - (x * 0.03) })
  }
  args.data = data
}

function addMissingBackgroundRect (g, { title, buffer, titleYPosition, width, height }) {
  g.append('svg:rect')
    .classed('mg-missing-background', true)
    .attr('x', buffer)
    .attr('y', buffer + (title ? titleYPosition : 0) * 2)
    .attr('width', width - buffer * 2)
    .attr('height', height - buffer * 2 - (title ? titleYPosition : 0) * 2)
    .attr('rx', 15)
    .attr('ry', 15)
}

function missingAddLine (g, { scaleFunctions, interpolate, data }) {
  const line = d3line()
    .x(scaleFunctions.xf)
    .y(scaleFunctions.yf)
    .curve(interpolate)

  g.append('path')
    .attr('class', 'mg-main-line mg-line1-color')
    .attr('d', line(data))
}

function missingAddArea (g, { scaleFunctions, scales, interpolate, data }) {
  const area = d3area()
    .x(scaleFunctions.xf)
    .y0(scales.Y.range()[0])
    .y1(scaleFunctions.yf)
    .curve(interpolate)

  g.append('path')
    .attr('class', 'mg-main-area mg-area1-color')
    .attr('d', area(data))
}

function removeAllChildren ({ target }) {
  select(target).selectAll('svg *').remove()
}

function missingRemoveLegend ({ legendTarget }) {
  if (legendTarget) {
    select(legendTarget).html('')
  }
}

export default function missingData (args) {
  this.init = (args) => {
    this.args = args

    initComputeWidth(args)
    initComputeHeight(args)

    // create svg if one doesn't exist

    const container = select(args.target)
    raiseContainerError(container, args)
    let svg = container.selectAll('svg')
    removeSvgIfChartTypeHasChanged(svg, args)
    svg = addSvgIfItDoesntExist(svg, args)
    adjustWidthAndHeightIfChanged(svg, args)
    setViewboxForScaling(svg, args)
    removeAllChildren(args)

    svg.classed('mg-missing', true)
    missingRemoveLegend(args)

    chartTitle(args)

    // are we adding a background placeholder
    if (args.show_missing_background) {
      makeFakeData(args)
      missingXScale(args)
      missingYScale(args)
      const g = addG(svg, 'mg-missing-pane')

      addMissingBackgroundRect(g, args)
      missingAddLine(g, args)
      missingAddArea(g, args)
    }

    missingAddText(svg, args)

    this.windowListeners()

    return this
  }

  this.windowListeners = () => {
    windowListeners(this.args)
    return this
  }

  this.init(args)
}

export const options = {
  top: [40, 'number'], // the size of the top margin
  bottom: [30, 'number'], // the size of the bottom margin
  right: [10, 'number'], // size of the right margin
  left: [0, 'number'], // size of the left margin
  buffer: [8, 'number'], // the buffer between the actual chart area and the margins
  legendTarget: ['', 'string'],
  width: [350, 'number'],
  height: [220, 'number'],
  missingText: ['Data currently missing or unavailable', 'string'],
  show_tooltips: [true, 'boolean'],
  show_missing_background: [true, 'boolean']
}
