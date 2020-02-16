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
  if (this.args.orientation === 'horizontal') labels = args.scales.Y.domain()
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
      .attr('x', getPlotRight(this.args))
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

export default class BarChart {
  constructor (args) {
    this.args = args

    args.xAxisType = inferType(this.args, 'x')
    args.yAxisType = inferType(this.args, 'y')

    // this is specific to how rects work in svg, let's keep track of the bar orientation to
    // plot appropriately.
    if (this.args.xAxisType === 'categorical') {
      args.orientation = 'vertical'
    } else if (this.args.yAxisType === 'categorical') {
      args.orientation = 'horizontal'
    } else if (this.args.xAxisType !== 'categorical' && args.yAxisType !== 'categorical') {
      // histogram.
      args.orientation = 'vertical'
    }

    rawDataTransformation(this.args)

    processPoint(this.args)
    init(this.args)

    if (this.args.xAxisType === 'categorical') {
      MGScale(this.args)
        .namespace('x')
        .categoricalDomainFromData()
        .categoricalRangeBands([0, args.xgroup_height], args.xgroup_accessor === null)

      if (this.args.xgroup_accessor) {
        MGScale(this.args)
          .namespace('xgroup')
          .categoricalDomainFromData()
          .categoricalRangeBands('bottom')
      } else {
        args.scales.XGROUP = d => getPlotLeft(this.args)
        args.scaleFunctions.xgroupf = d => getPlotLeft(this.args)
      }

      args.scaleFunctions.xoutf = d => args.scaleFunctions.xf(d) + args.scaleFunctions.xgroupf(d)
    } else {
      MGScale(this.args)
        .namespace('x')
        .inflateDomain(true)
        .zeroBottom(this.args.yAxisType === 'categorical')
        .numericalDomainFromData((this.args.baselines || []).map(d => d[args.xAccessor]))
        .numericalRange('bottom')

      args.scaleFunctions.xoutf = args.scaleFunctions.xf
    }

    // y-scale generation. This needs to get simplified.
    if (this.args.yAxisType === 'categorical') {
      MGScale(this.args)
        .namespace('y')
        .zeroBottom(true)
        .categoricalDomainFromData()
        .categoricalRangeBands([0, args.yGroupHeight], true)

      if (this.args.yGroupAccessor) {
        new MGScale(this.args)
          .namespace('ygroup')
          .categoricalDomainFromData()
          .categoricalRangeBands('left')
      } else {
        args.scales.YGROUP = () => getPlotTop(this.args)
        args.scaleFunctions.yGroupFunction = d => getPlotTop(this.args)
      }
      args.scaleFunctions.youtf = d => args.scaleFunctions.yf(d) + args.scaleFunctions.yGroupFunction(d)
    } else {
      const baselines = (this.args.baselines || []).map(d => d[args.yAccessor])

      MGScale(this.args)
        .namespace('y')
        .inflateDomain(true)
        .zeroBottom(this.args.xAxisType === 'categorical')
        .numericalDomainFromData(baselines)
        .numericalRange('left')

      args.scaleFunctions.youtf = d => args.scaleFunctions.yf(d)
    }

    if (this.args.yGroupAccessor !== null) {
      args.ycolorAccessor = args.yAccessor
      MGScale(this.args)
        .namespace('ycolor')
        .scaleName('color')
        .categoricalDomainFromData()
        .categoricalColorRange()
    }

    if (this.args.xgroup_accessor !== null) {
      args.xcolorAccessor = args.xAccessor
      MGScale(this.args)
        .namespace('xcolor')
        .scaleName('color')
        .categoricalDomainFromData()
        .categoricalColorRange()
    }

    axisFactory(this.args)
      .namespace('x')
      .type(this.args.xAxisType)
      .zeroLine(this.args.yAxisType === 'categorical')
      .position(this.args.xAxis_position)
      .draw()

    axisFactory(this.args)
      .namespace('y')
      .type(this.args.yAxisType)
      .zeroLine(this.args.xAxisType === 'categorical')
      .position(this.args.yAxis_position)
      .draw()

    this.mainPlot()
    this.markers()
    this.rollover()
    this.windowListeners()
  }

  mainPlot () {
    const svg = getSvgChildOf(this.args.target)
    const data = this.args.data[0]
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
      .classed('default-bar', !this.args.scales.COLOR)

    // appropriate_size = args.scales.Y_ingroup.rangeBand()/1.5;
    let length, width, lengthType, widthType, lengthCoord, widthCoord,
      lengthScaleFunction, widthScaleFunction, lengthScale, widthScale,
      lengthAccessor, widthAccessor, lengthCoordMap,
      lengthMap

    let referenceLengthMap, referenceLengthCoordFunction

    if (this.args.orientation === 'vertical') {
      length = 'height'
      width = 'width'
      lengthType = this.args.yAxisType
      widthType = this.args.xAxisType
      lengthCoord = 'y'
      widthCoord = 'x'
      lengthScaleFunction = lengthType === 'categorical' ? this.args.scaleFunctions.youtf : this.args.scaleFunctions.yf
      widthScaleFunction = widthType === 'categorical' ? this.args.scaleFunctions.xoutf : this.args.scaleFunctions.xf
      lengthScale = this.args.scales.Y
      widthScale = this.args.scales.X
      lengthAccessor = this.args.yAccessor
      widthAccessor = this.args.xAccessor

      lengthCoordMap = d => {
        let l
        l = lengthScaleFunction(d)
        if (d[lengthAccessor] < 0) {
          l = lengthScale(0)
        }
        return l
      }

      lengthMap = d => Math.abs(lengthScaleFunction(d) - lengthScale(0))

      referenceLengthMap = d => Math.abs(lengthScale(d[this.args.referenceAccessor]) - lengthScale(0))

      referenceLengthCoordFunction = d => lengthScale(d[this.args.referenceAccessor])
    }

    if (this.args.orientation === 'horizontal') {
      length = 'width'
      width = 'height'
      lengthType = this.args.xAxisType
      widthType = this.args.yAxisType
      lengthCoord = 'x'
      widthCoord = 'y'
      lengthScaleFunction = lengthType === 'categorical' ? this.args.scaleFunctions.xoutf : this.args.scaleFunctions.xf
      widthScaleFunction = widthType === 'categorical' ? this.args.scaleFunctions.youtf : this.args.scaleFunctions.yf
      lengthScale = this.args.scales.X
      widthScale = this.args.scales.Y
      lengthAccessor = this.args.xAccessor
      widthAccessor = this.args.yAccessor

      lengthCoordMap = d => lengthScale(0)

      lengthMap = d => Math.abs(lengthScaleFunction(d) - lengthScale(0))

      referenceLengthMap = d => Math.abs(lengthScale(d[this.args.referenceAccessor]) - lengthScale(0))

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
      w = w - this.args.bar_thickness / 2
      return w
    })

    if (this.args.scales.COLOR) {
      bars.attr('fill', this.args.scaleFunctions.colorFunction)
    }

    bars
      .attr(length, lengthMap)
      .attr(width, d => this.args.bar_thickness)

    if (this.args.referenceAccessor !== null) {
      const referenceData = data.filter(d => d[this.args.referenceAccessor])
      const referenceBars = barplot.selectAll('.mg-categorical-reference')
        .data(referenceData)
        .enter()
        .append('rect')

      referenceBars
        .attr(lengthCoord, referenceLengthCoordFunction)
        .attr(widthCoord, d => widthScaleFunction(d) - this.args.referenceThickness / 2)
        .attr(length, referenceLengthMap)
        .attr(width, this.args.referenceThickness)
    }

    if (this.args.comparisonAccessor !== null) {
      let comparisonThickness = null
      if (this.args.comparisonThickness === null) {
        comparisonThickness = this.args.bar_thickness / 2
      } else {
        comparisonThickness = this.args.comparisonThickness
      }

      const comparisonData = data.filter(d => d[this.args.comparison_accessor])
      const comparisonMarks = barplot.selectAll('.mg-categorical-comparison')
        .data(comparisonData)
        .enter()
        .append('line')

      comparisonMarks
        .attr(`${lengthCoord}1`, d => lengthScale(d[this.args.comparisonAccessor]))
        .attr(`${lengthCoord}2`, d => lengthScale(d[this.args.comparisonAccessor]))
        .attr(`${widthCoord}1`, d => widthScaleFunction(d) - comparisonThickness / 2)
        .attr(`${widthCoord}2`, d => widthScaleFunction(d) + comparisonThickness / 2)
        .attr('stroke', 'black')
        .attr('stroke-width', this.args.comparison_width)
    }

    if (this.args.legend || (this.args.colorAccessor !== null && this.args.yGroupAccessor !== this.args.colorAccessor)) {
      if (!this.args.legendTarget) legendOnGraph(svg, this.args)
      else targetedLegend(this.args)
    }
  }

  markers () { return markers(this.args) }

  rollover () {
    const svg = getSvgChildOf(this.args.target)

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

    if (this.args.orientation === 'vertical') {
      length = 'height'
      width = 'width'
      widthType = this.args.xAxisType
      lengthCoord = 'y'
      widthCoord = 'x'
      widthScaleFunction = widthType === 'categorical' ? this.args.scaleFunctions.xoutf : this.args.scaleFunctions.xf
      lengthScale = this.args.scales.Y
      widthScale = this.args.scales.X
      widthAccessor = this.args.xAccessor

      lengthCoordMap = d => getPlotTop(this.args)

      lengthMap = d => this.args.height - this.args.top - this.args.bottom - this.args.buffer * 2
    }

    if (this.args.orientation === 'horizontal') {
      length = 'width'
      width = 'height'
      widthType = this.args.yAxisType
      lengthCoord = 'x'
      widthCoord = 'y'
      widthScaleFunction = widthType === 'categorical' ? this.args.scaleFunctions.youtf : this.args.scaleFunctions.yf
      lengthScale = this.args.scales.X
      widthScale = this.args.scales.Y
      widthAccessor = this.args.yAccessor

      lengthCoordMap = d => lengthScale(0)

      lengthMap = d => this.args.width - this.args.left - this.args.right - this.args.buffer * 2
    }

    // rollover text
    let rolloverX, rolloverAnchor
    if (this.args.rollover_align === 'right') {
      rolloverX = this.args.width - this.args.right
      rolloverAnchor = 'end'
    } else if (this.args.rollover_align === 'left') {
      rolloverX = this.args.left
      rolloverAnchor = 'start'
    } else {
      rolloverX = (this.args.width - this.args.left - this.args.right) / 2 + this.args.left
      rolloverAnchor = 'middle'
    }

    svg.append('text')
      .attr('class', 'mg-active-datapoint')
      .attr('xml:space', 'preserve')
      .attr('x', rolloverX)
      .attr('y', this.args.top * 0.75)
      .attr('dy', '.35em')
      .attr('text-anchor', rolloverAnchor)

    const g = svg.append('g')
      .attr('class', 'mg-rollover-rect')

    // draw rollover bars
    const bars = g.selectAll('.mg-bar-rollover')
      .data(this.args.data[0]).enter()
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
        w = w - this.args.bar_thickness / 2
        return w
      })

    bars.attr(length, lengthMap)
    bars.attr(width, d => this.args.bar_thickness)

    bars
      .on('mouseover', this.rolloverOn(this.args))
      .on('mouseout', this.rolloverOff(this.args))
      .on('mousemove', this.rolloverMove(this.args))
  }

  rolloverOn () {
    const svg = getSvgChildOf(this.args.target)

    return (d, i) => {
      // highlight active bar
      const bar = svg.selectAll('g.mg-barplot .mg-bar')
        .filter((d, j) => j === i).classed('active', true)

      if (this.args.scales.COLOR) {
        bar.attr('fill', rgb(this.args.scaleFunctions.colorFunction(d)).darker())
      } else {
        bar.classed('default-active', true)
      }

      // update rollover text
      if (this.args.show_rollover_text) {
        const mouseover = mouseoverText(this.args, { svg })
        let row = mouseover.mouseover_row()

        if (this.args.yGroupAccessor) row.text(`${d[this.args.yGroupAccessor]}   `).bold()

        row.text(formatXMouseover(this.args, d))
        row.text(`${this.args.yAccessor}: ${d[this.args.yAccessor]}`)
        if (this.args.predictorAccessor || this.args.baselineAccessor) {
          row = mouseover.mouseover_row()

          if (this.args.predictorAccessor) row.text(formatDataForMouseover(this.args, d, null, this.args.predictorAccessor, false))
          if (this.args.baselineAccessor) row.text(formatDataForMouseover(this.args, d, null, this.args.baselineAccessor, false))
        }
      }
      if (this.args.mouseover) {
        this.args.mouseover(d, i)
      }
    }
  }

  rolloverOff () {
    const svg = getSvgChildOf(this.args.target)

    return (d, i) => {
      // reset active bar
      const bar = svg.selectAll('g.mg-barplot .mg-bar.active').classed('active', false)

      if (this.args.scales.COLOR) {
        bar.attr('fill', this.args.scaleFunctions.colorFunction(d))
      } else {
        bar.classed('default-active', false)
      }

      // reset active data point text
      svg.select('.mg-active-datapoint')
        .text('')

      clearMouseoverContainer(svg)

      if (this.args.mouseout) {
        this.args.mouseout(d, i)
      }
    }
  }

  rolloverMove () {
    return (d, i) => {
      if (this.args.mousemove) {
        this.args.mousemove(d, i)
      }
    }
  }

  windowListeners () { windowListeners(this.args) }
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
