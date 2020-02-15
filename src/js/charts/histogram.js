import { rawDataTransformation, processHistogram } from '../misc/process'
import { init } from '../common/init'
import { MGScale } from '../common/scales'
import { xAxis } from '../common/xAxis'
import { yAxis } from '../common/yAxis'
import { getSvgChildOf, addG } from '../misc/utility'
import { markers } from '../common/markers'
import { formatXMouseover, formatYMouseover } from '../misc/formatters'
import { globals } from '../common/dataGraphic'
import { selectAll, select } from 'd3-selection'
import { mouseoverText, setupMouseoverContainer, clearMouseoverContainer } from '../common/rollover'
import { windowListeners } from '../common/windowListeners'

export default class HistogramGraph {
  constructor (args) {
    this.args = args

    rawDataTransformation(this.args)
    processHistogram(this.args)
    init(this.args)

    new MGScale(this.args)
      .namespace('x')
      .numericalDomainFromData()
      .numericalRange('bottom')

    const baselines = (this.args.baselines || []).map(d => d[args.yAccessor])

    new MGScale(this.args)
      .namespace('y')
      .zeroBottom(true)
      .inflateDomain(true)
      .numericalDomainFromData(baselines)
      .numericalRange('left')

    xAxis(this.args)
    yAxis(this.args)

    this.mainPlot()
    this.markers()
    this.rollover()
    this.windowListeners()
  }

  mainPlot () {
    const svg = getSvgChildOf(this.args.target)

    // remove the old histogram, add new one
    svg.selectAll('.mg-histogram').remove()

    const g = svg.append('g')
      .attr('class', 'mg-histogram')

    const bar = g.selectAll('.mg-bar')
      .data(this.args.data[0])
      .enter().append('g')
      .attr('class', 'mg-bar')
      .attr('transform', d => `translate(${this.args.scales.X(d[this.args.xAccessor]).toFixed(2)},${this.args.scales.Y(d[this.args.yAccessor]).toFixed(2)})`)

    // draw bars
    bar.append('rect')
      .attr('x', 1)
      .attr('width', (d, i) => {
        if (this.args.data[0].length === 1) {
          return (this.args.scaleFunctions.xf(this.args.data[0][0]) - this.args.bar_margin).toFixed(0)
        } else if (i !== this.args.data[0].length - 1) {
          return (this.args.scaleFunctions.xf(this.args.data[0][i + 1]) - this.args.scaleFunctions.xf(d)).toFixed(0)
        } else {
          return (this.args.scaleFunctions.xf(this.args.data[0][1]) - this.args.scaleFunctions.xf(this.args.data[0][0])).toFixed(0)
        }
      })
      .attr('height', d => {
        if (d[this.args.yAccessor] === 0) {
          return 0
        }

        return (this.args.height - this.args.bottom - this.args.buffer - this.args.scales.Y(d[this.args.yAccessor])).toFixed(2)
      })
  }

  markers () { markers(this.args) }

  rollover () {
    const svg = getSvgChildOf(this.args.target)

    if (svg.selectAll('.mg-active-datapoint-container').nodes().length === 0) {
      addG(svg, 'mg-active-datapoint-container')
    }

    // remove the old rollovers if they already exist
    svg.selectAll('.mg-rollover-rect').remove()
    svg.selectAll('.mg-active-datapoint').remove()

    const g = svg.append('g')
      .attr('class', 'mg-rollover-rect')

    // draw rollover bars
    const bar = g.selectAll('.mg-bar')
      .data(this.args.data[0])
      .enter().append('g')
      .attr('class', (d, i) => {
        if (this.args.linked) {
          return `mg-rollover-rects roll_${i}`
        } else {
          return 'mg-rollover-rects'
        }
      })
      .attr('transform', d => `translate(${this.args.scales.X(d[this.args.xAccessor])},${0})`)

    bar.append('rect')
      .attr('x', 1)
      .attr('y', this.args.buffer + (this.args.title ? this.args.titleYPosition : 0))
      .attr('width', (d, i) => {
        // if data set is of length 1
        if (this.args.data[0].length === 1) {
          return (this.args.scaleFunctions.xf(this.args.data[0][0]) - this.args.bar_margin).toFixed(0)
        } else if (i !== this.args.data[0].length - 1) {
          return (this.args.scaleFunctions.xf(this.args.data[0][i + 1]) - this.args.scaleFunctions.xf(d)).toFixed(0)
        } else {
          return (this.args.scaleFunctions.xf(this.args.data[0][1]) - this.args.scaleFunctions.xf(this.args.data[0][0])).toFixed(0)
        }
      })
      .attr('height', () => this.args.height)
      .attr('opacity', 0)
      .on('mouseover', this.rolloverOn(this.args))
      .on('mouseout', this.rolloverOff(this.args))
      .on('mousemove', this.rolloverMove(this.args))
  }

  rolloverOn () {
    const svg = getSvgChildOf(this.args.target)

    return (d, i) => {
      svg.selectAll('text')
        .filter((g, j) => d === g)
        .attr('opacity', 0.3)

      svg.selectAll('.mg-bar rect')
        .filter((d, j) => j === i)
        .classed('active', true)

      // trigger mouseover on all matching bars
      if (this.args.linked && !globals.link) {
        globals.link = true

        // trigger mouseover on matching bars in .linked charts
        selectAll(`.mg-rollover-rects.roll_${i} rect`)
          .each(function (d) { // use existing i
            select(this).on('mouseover')(d, i)
          })
      }

      // update rollover text
      if (this.args.show_rollover_text) {
        const mo = mouseoverText(this.args, { svg })
        const row = mo.mouseover_row()
        row.text('\u259F  ').elem
          .classed('hist-symbol', true)

        row.text(formatXMouseover(this.args, d)) // x
        row.text(formatYMouseover(this.args, d, this.args.timeSeries === false))
      }

      if (this.args.mouseover) {
        setupMouseoverContainer(svg, this.args)
        this.args.mouseover(d, i)
      }
    }
  }

  rolloverOff () {
    const svg = getSvgChildOf(this.args.target)

    return (d, i) => {
      if (this.args.linked && globals.link) {
        globals.link = false

        // trigger mouseout on matching bars in .linked charts
        selectAll(`.mg-rollover-rects.roll_${i} rect`)
          .each(function (d) { // use existing i
            select(this).on('mouseout')(d, i)
          })
      }

      // reset active bar
      svg.selectAll('.mg-bar rect')
        .classed('active', false)

      // reset active data point text
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
  bar_margin: [1, 'number'], // the margin between bars
  binned: [false, 'boolean'], // determines whether the data is already binned
  bins: [null, ['number', 'number[]', 'function']], // the number of bins to use. type: {null, number | thresholds | threshold_function}
  processed_xAccessor: ['x', 'string'],
  processed_yAccessor: ['y', 'string'],
  processed_dxAccessor: ['dx', 'string']
}
