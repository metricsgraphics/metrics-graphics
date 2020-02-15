import { getSvgChildOf, getPlotRight, inferType, getPlotLeft, getPlotTop, addG } from '../misc/utility'
import { select } from 'd3-selection'
import { rawDataTransformation, processPoint } from '../misc/process'
import { init } from '../common/init'
import { MGScale } from '../common/scales'
import { axisFactory } from '../common/yAxis'
import { windowListeners } from '../common/windowListeners'
import { clearMouseoverContainer, mouseoverText } from '../common/rollover'
import { formatDataForMouseover, formatXMouseover } from '../misc/formatters'
import { rgb } from 'd3-color'
import { markers } from '../common/markers'

function targetedLegend ({ legendTarget, orientation, scales }) {
  let labels
  if (legendTarget) {
    const div = select(legendTarget).append('div').classed('mg-bar-target-legend', true)

    if (orientation === 'horizontal') labels = scales.Y.domain()
    else labels = scales.X.domain()

    labels.forEach(label => {
      const outerSpan = div.append('span').classed('mg-bar-target-element', true)
      outerSpan.append('span')
        .classed('mg-bar-target-legend-shape', true)
        .style('color', scales.COLOR(label))
        .text('\u25FC ')
      outerSpan.append('span')
        .classed('mg-bar-target-legend-text', true)
        .text(label)
    })
  }
}

function legendOnGraph (svg, args) {
  // draw each element at the top right
  // get labels

  let labels
  if (args.orientation === 'horizontal') labels = args.scales.Y.domain()
  else labels = args.scales.X.domain()

  let lineCount = 0
  const lineHeight = 1.1
  const g = svg.append('g').classed('mg-bar-legend', true)
  const textContainer = g.append('text')

  textContainer
    .selectAll('*')
    .remove()
  textContainer
    .attr('width', args.right)
    .attr('height', 100)
    .attr('text-anchor', 'start')

  labels.forEach(label => {
    const subContainer = textContainer.append('tspan')
      .attr('x', getPlotRight(args))
      .attr('y', args.height / 2)
      .attr('dy', `${lineCount * lineHeight}em`)
    subContainer.append('tspan')
      .text('\u25a0 ')
      .attr('fill', args.scales.COLOR(label))
      .attr('font-size', 20)
    subContainer.append('tspan')
      .text(label)
      .attr('font-weight', 300)
      .attr('font-size', 10)
    lineCount++
  })
}

export default function barChart (args) {
  this.args = args

  this.init = (args) => {
    this.args = args
    args.xAxis_type = inferType(args, 'x')
    args.yAxis_type = inferType(args, 'y')

    // this is specific to how rects work in svg, let's keep track of the bar orientation to
    // plot appropriately.
    if (args.xAxis_type === 'categorical') {
      args.orientation = 'vertical'
    } else if (args.yAxis_type === 'categorical') {
      args.orientation = 'horizontal'
    } else if (args.xAxis_type !== 'categorical' && args.yAxis_type !== 'categorical') {
      // histogram.
      args.orientation = 'vertical'
    }

    rawDataTransformation(args)

    processPoint(args)
    init(args)

    if (args.xAxis_type === 'categorical') {
      MGScale(args)
        .namespace('x')
        .categoricalDomainFromData()
        .categoricalRangeBands([0, args.xgroup_height], args.xgroup_accessor === null)

      if (args.xgroup_accessor) {
        MGScale(args)
          .namespace('xgroup')
          .categoricalDomainFromData()
          .categoricalRangeBands('bottom')
      } else {
        args.scales.XGROUP = d => getPlotLeft(args)
        args.scaleFunctions.xgroupf = d => getPlotLeft(args)
      }

      args.scaleFunctions.xoutf = d => args.scaleFunctions.xf(d) + args.scaleFunctions.xgroupf(d)
    } else {
      MGScale(args)
        .namespace('x')
        .inflateDomain(true)
        .zeroBottom(args.yAxis_type === 'categorical')
        .numericalDomainFromData((args.baselines || []).map(d => d[args.xAccessor]))
        .numericalRange('bottom')

      args.scaleFunctions.xoutf = args.scaleFunctions.xf
    }

    // y-scale generation. This needs to get simplified.
    if (args.yAxis_type === 'categorical') {
      MGScale(args)
        .namespace('y')
        .zeroBottom(true)
        .categoricalDomainFromData()
        .categoricalRangeBands([0, args.yGroupHeight], true)

      if (args.yGroupAccessor) {
        new MGScale(args)
          .namespace('ygroup')
          .categoricalDomainFromData()
          .categoricalRangeBands('left')
      } else {
        args.scales.YGROUP = () => getPlotTop(args)
        args.scaleFunctions.yGroupFunction = d => getPlotTop(args)
      }
      args.scaleFunctions.youtf = d => args.scaleFunctions.yf(d) + args.scaleFunctions.yGroupFunction(d)
    } else {
      const baselines = (args.baselines || []).map(d => d[args.yAccessor])

      MGScale(args)
        .namespace('y')
        .inflateDomain(true)
        .zeroBottom(args.xAxis_type === 'categorical')
        .numericalDomainFromData(baselines)
        .numericalRange('left')

      args.scaleFunctions.youtf = d => args.scaleFunctions.yf(d)
    }

    if (args.yGroupAccessor !== null) {
      args.ycolorAccessor = args.yAccessor
      MGScale(args)
        .namespace('ycolor')
        .scaleName('color')
        .categoricalDomainFromData()
        .categoricalColorRange()
    }

    if (args.xgroup_accessor !== null) {
      args.xcolorAccessor = args.xAccessor
      MGScale(args)
        .namespace('xcolor')
        .scaleName('color')
        .categoricalDomainFromData()
        .categoricalColorRange()
    }

    axisFactory(args)
      .namespace('x')
      .type(args.xAxis_type)
      .zeroLine(args.yAxis_type === 'categorical')
      .position(args.xAxis_position)
      .draw()

    axisFactory(args)
      .namespace('y')
      .type(args.yAxis_type)
      .zeroLine(args.xAxis_type === 'categorical')
      .position(args.yAxis_position)
      .draw()

    this.mainPlot()
    this.markers()
    this.rollover()
    this.windowListeners()

    return this
  }

  this.mainPlot = () => {
    const svg = getSvgChildOf(args.target)
    const data = args.data[0]
    let barplot = svg.select('g.mg-barplot')
    const freshRender = barplot.empty()

    // draw the plot on first render
    if (freshRender) {
      barplot = svg.append('g')
        .classed('mg-barplot', true)
    }

    const bars = barplot.selectAll('.mg-bar')
      .data(data)
      .enter()
      .append('rect')
      .classed('mg-bar', true)
      .classed('default-bar', !args.scales.COLOR)

    // appropriate_size = args.scales.Y_ingroup.rangeBand()/1.5;
    let length, width, lengthType, widthType, lengthCoord, widthCoord,
      lengthScaleFunction, widthScaleFunction, lengthScale, widthScale,
      lengthAccessor, widthAccessor, lengthCoordMap,
      lengthMap

    let referenceLengthMap, referenceLengthCoordFunction

    if (args.orientation === 'vertical') {
      length = 'height'
      width = 'width'
      lengthType = args.yAxis_type
      widthType = args.xAxis_type
      lengthCoord = 'y'
      widthCoord = 'x'
      lengthScaleFunction = lengthType === 'categorical' ? args.scaleFunctions.youtf : args.scaleFunctions.yf
      widthScaleFunction = widthType === 'categorical' ? args.scaleFunctions.xoutf : args.scaleFunctions.xf
      lengthScale = args.scales.Y
      widthScale = args.scales.X
      lengthAccessor = args.yAccessor
      widthAccessor = args.xAccessor

      lengthCoordMap = d => {
        let l
        l = lengthScaleFunction(d)
        if (d[lengthAccessor] < 0) {
          l = lengthScale(0)
        }
        return l
      }

      lengthMap = d => Math.abs(lengthScaleFunction(d) - lengthScale(0))

      referenceLengthMap = d => Math.abs(lengthScale(d[args.referenceAccessor]) - lengthScale(0))

      referenceLengthCoordFunction = d => lengthScale(d[args.referenceAccessor])
    }

    if (args.orientation === 'horizontal') {
      length = 'width'
      width = 'height'
      lengthType = args.xAxis_type
      widthType = args.yAxis_type
      lengthCoord = 'x'
      widthCoord = 'y'
      lengthScaleFunction = lengthType === 'categorical' ? args.scaleFunctions.xoutf : args.scaleFunctions.xf
      widthScaleFunction = widthType === 'categorical' ? args.scaleFunctions.youtf : args.scaleFunctions.yf
      lengthScale = args.scales.X
      widthScale = args.scales.Y
      lengthAccessor = args.xAccessor
      widthAccessor = args.yAccessor

      lengthCoordMap = d => lengthScale(0)

      lengthMap = d => Math.abs(lengthScaleFunction(d) - lengthScale(0))

      referenceLengthMap = d => Math.abs(lengthScale(d[args.referenceAccessor]) - lengthScale(0))

      referenceLengthCoordFunction = d => lengthScale(0)
    }

    bars.attr(lengthCoord, lengthCoordMap)

    // bars.attr(lengthCoord, 40)
    // bars.attr(widthCoord, 70)

    bars.attr(widthCoord, d => {
      let w
      if (widthType === 'categorical') {
        w = widthScaleFunction(d)
      } else {
        w = widthScale(0)
        if (d[widthAccessor] < 0) {
          w = widthScaleFunction(d)
        }
      }
      w = w - args.bar_thickness / 2
      return w
    })

    if (args.scales.COLOR) {
      bars.attr('fill', args.scaleFunctions.colorFunction)
    }

    bars
      .attr(length, lengthMap)
      .attr(width, d => args.bar_thickness)

    if (args.referenceAccessor !== null) {
      const referenceData = data.filter(d => d[args.referenceAccessor])
      const referenceBars = barplot.selectAll('.mg-categorical-reference')
        .data(referenceData)
        .enter()
        .append('rect')

      referenceBars
        .attr(lengthCoord, referenceLengthCoordFunction)
        .attr(widthCoord, d => widthScaleFunction(d) - args.referenceThickness / 2)
        .attr(length, referenceLengthMap)
        .attr(width, args.referenceThickness)
    }

    if (args.comparisonAccessor !== null) {
      let comparisonThickness = null
      if (args.comparisonThickness === null) {
        comparisonThickness = args.bar_thickness / 2
      } else {
        comparisonThickness = args.comparisonThickness
      }

      const comparisonData = data.filter(d => d[args.comparison_accessor])
      const comparisonMarks = barplot.selectAll('.mg-categorical-comparison')
        .data(comparisonData)
        .enter()
        .append('line')

      comparisonMarks
        .attr(`${lengthCoord}1`, d => lengthScale(d[args.comparisonAccessor]))
        .attr(`${lengthCoord}2`, d => lengthScale(d[args.comparisonAccessor]))
        .attr(`${widthCoord}1`, d => widthScaleFunction(d) - comparisonThickness / 2)
        .attr(`${widthCoord}2`, d => widthScaleFunction(d) + comparisonThickness / 2)
        .attr('stroke', 'black')
        .attr('stroke-width', args.comparison_width)
    }

    if (args.legend || (args.colorAccessor !== null && args.yGroupAccessor !== args.colorAccessor)) {
      if (!args.legendTarget) legendOnGraph(svg, args)
      else targetedLegend(args)
    }
    return this
  }

  this.markers = () => {
    markers(args)
    return this
  }

  this.rollover = () => {
    const svg = getSvgChildOf(args.target)

    if (svg.selectAll('.mg-active-datapoint-container').nodes().length === 0) {
      addG(svg, 'mg-active-datapoint-container')
    }

    // remove the old rollovers if they already exist
    svg.selectAll('.mg-rollover-rect').remove()
    svg.selectAll('.mg-active-datapoint').remove()

    // get orientation
    let length, width, widthType, lengthCoord, widthCoord,
      widthScaleFunction, lengthScale, widthScale, widthAccessor, lengthMap

    let lengthCoordMap

    if (args.orientation === 'vertical') {
      length = 'height'
      width = 'width'
      widthType = args.xAxis_type
      lengthCoord = 'y'
      widthCoord = 'x'
      widthScaleFunction = widthType === 'categorical' ? args.scaleFunctions.xoutf : args.scaleFunctions.xf
      lengthScale = args.scales.Y
      widthScale = args.scales.X
      widthAccessor = args.xAccessor

      lengthCoordMap = d => getPlotTop(args)

      lengthMap = d => args.height - args.top - args.bottom - args.buffer * 2
    }

    if (args.orientation === 'horizontal') {
      length = 'width'
      width = 'height'
      widthType = args.yAxis_type
      lengthCoord = 'x'
      widthCoord = 'y'
      widthScaleFunction = widthType === 'categorical' ? args.scaleFunctions.youtf : args.scaleFunctions.yf
      lengthScale = args.scales.X
      widthScale = args.scales.Y
      widthAccessor = args.yAccessor

      lengthCoordMap = d => lengthScale(0)

      lengthMap = d => args.width - args.left - args.right - args.buffer * 2
    }

    // rollover text
    let rolloverX, rolloverAnchor
    if (args.rollover_align === 'right') {
      rolloverX = args.width - args.right
      rolloverAnchor = 'end'
    } else if (args.rollover_align === 'left') {
      rolloverX = args.left
      rolloverAnchor = 'start'
    } else {
      rolloverX = (args.width - args.left - args.right) / 2 + args.left
      rolloverAnchor = 'middle'
    }

    svg.append('text')
      .attr('class', 'mg-active-datapoint')
      .attr('xml:space', 'preserve')
      .attr('x', rolloverX)
      .attr('y', args.top * 0.75)
      .attr('dy', '.35em')
      .attr('text-anchor', rolloverAnchor)

    const g = svg.append('g')
      .attr('class', 'mg-rollover-rect')

    // draw rollover bars
    const bars = g.selectAll('.mg-bar-rollover')
      .data(args.data[0]).enter()
      .append('rect')
      .attr('class', 'mg-bar-rollover')

    bars.attr('opacity', 0)
      .attr(lengthCoord, lengthCoordMap)
      .attr(widthCoord, d => {
        let w
        if (widthType === 'categorical') {
          w = widthScaleFunction(d)
        } else {
          w = widthScale(0)
          if (d[widthAccessor] < 0) {
            w = widthScaleFunction(d)
          }
        }
        w = w - args.bar_thickness / 2
        return w
      })

    bars.attr(length, lengthMap)
    bars.attr(width, d => args.bar_thickness)

    bars
      .on('mouseover', this.rolloverOn(args))
      .on('mouseout', this.rolloverOff(args))
      .on('mousemove', this.rolloverMove(args))

    return this
  }

  this.rolloverOn = (args) => {
    const svg = getSvgChildOf(args.target)

    return (d, i) => {
      // highlight active bar
      const bar = svg.selectAll('g.mg-barplot .mg-bar')
        .filter((d, j) => j === i).classed('active', true)

      if (args.scales.COLOR) {
        bar.attr('fill', rgb(args.scaleFunctions.colorFunction(d)).darker())
      } else {
        bar.classed('default-active', true)
      }

      // update rollover text
      if (args.show_rollover_text) {
        const mouseover = mouseoverText(args, { svg })
        let row = mouseover.mouseover_row()

        if (args.yGroupAccessor) row.text(`${d[args.yGroupAccessor]}   `).bold()

        row.text(formatXMouseover(args, d))
        row.text(`${args.yAccessor}: ${d[args.yAccessor]}`)
        if (args.predictorAccessor || args.baselineAccessor) {
          row = mouseover.mouseover_row()

          if (args.predictorAccessor) row.text(formatDataForMouseover(args, d, null, args.predictorAccessor, false))
          if (args.baselineAccessor) row.text(formatDataForMouseover(args, d, null, args.baselineAccessor, false))
        }
      }
      if (args.mouseover) {
        args.mouseover(d, i)
      }
    }
  }

  this.rolloverOff = (args) => {
    const svg = getSvgChildOf(args.target)

    return (d, i) => {
      // reset active bar
      const bar = svg.selectAll('g.mg-barplot .mg-bar.active').classed('active', false)

      if (args.scales.COLOR) {
        bar.attr('fill', args.scaleFunctions.colorFunction(d))
      } else {
        bar.classed('default-active', false)
      }

      // reset active data point text
      svg.select('.mg-active-datapoint')
        .text('')

      clearMouseoverContainer(svg)

      if (args.mouseout) {
        args.mouseout(d, i)
      }
    }
  }

  this.rolloverMove = (args) => (d, i) => {
    if (args.mousemove) {
      args.mousemove(d, i)
    }
  }

  this.windowListeners = () => {
    windowListeners(this.args)
    return this
  }

  this.init(args)
}

export const options = {
  buffer: [16, 'number'],
  yAccessor: ['factor', 'string'],
  xAccessor: ['value', 'string'],
  referenceAccessor: [null, 'string'],
  comparisonAccessor: [null, 'string'],
  secondaryLabel_accessor: [null, 'string'],
  colorAccessor: [null, 'string'],
  colorType: ['category', ['number', 'category']],
  colorDomain: [null, 'number[]'],
  referenceThickness: [1, 'number'],
  comparison_width: [3, 'number'],
  comparisonThickness: [null, 'number'],
  legend: [false, 'boolean'],
  legendTarget: [null, 'string'],
  mouseover_align: ['right', ['right', 'left']],
  baselineAccessor: [null, 'string'],
  predictorAccessor: [null, 'string'],
  predictor_proportion: [5, 'number'],
  showBarZero: [true, 'boolean'],
  binned: [true, 'boolean'],
  truncateXLabels: [true, 'boolean'],
  truncate_yLabels: [true, 'boolean']
}
