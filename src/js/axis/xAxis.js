import * as utility from '../misc/utility'
import { max, min, extent } from 'd3-array'
import { select } from 'd3-selection'
import { timeDays, timeYears } from 'd3-time'
import { timeFormat as d3TimeFormat } from 'd3-time-format'
import { processScaleTicks } from '../misc/process'
import { format } from 'd3-format'
import { scaleLinear, scaleOrdinal } from 'd3-scale'
import { schemeCategory10 } from 'd3-scale-chromatic'
import { addScaleFunction, addColorCategoricalScale } from '../common/scales'
import constants from '../misc/constants'
import Axis from './axis'

export default class XAxis extends Axis {
  format = null
  isTimeSeries = false

  constructor ({ type, label, chartType, format, data, accessor }) {
    super({ type, label })

    // determine if the data is a time series
    this.isTimeSeries = data.some(series => series.length > 0 && series[0][accessor] instanceof Date)

    // set format
    if (format) this.format = format
    else {
      switch (chartType) {
        case constants.chartType.line:
        case constants.chartType.point:
        case constants.chartType.histogram:
          this.format = this.defaultXaxFormat(args)
          break
        case constants.chartType.bar:
          this.format = this.defaultBarXaxFormat(args)
      }
    }
  }

  xRug (args) {
    if (!args.xRug) return

    args.rugBufferSize = args.chartType === constants.chartType.point
      ? args.buffer / 2
      : args.buffer

    const rug = utility.makeRug(args, 'mg-x-rug')

    rug.attr('x1', args.scaleFunctions.xf)
      .attr('x2', args.scaleFunctions.xf)
      .attr('y1', args.height - args.bottom - args.rugBufferSize)
      .attr('y2', args.height - args.bottom)

    utility.addColorAccessorToRug(rug, args, 'mg-x-rug-mono')
  }

  addProcessedObject (args) { if (!args.processed) args.processed = {} }

  // TODO ought to be deprecated, only used by histogram
  xAxis (args) {
    const svg = utility.getSvgChildOf(args.target)
    this.addProcessedObject(args)

    this.selectXaxFormat(args)
    utility.selectAllAndRemove(svg, '.mg-x-axis')

    if (!args.xAxis) {
      return this
    }

    const g = utility.addG(svg, 'mg-x-axis')

    this.addXTicks(g, args)
    this.addXTickLabels(g, args)
    if (args.xLabel) { this.addXLabel(g, args) }
    if (args.xRug) { this.xRug(args) }

    return this
  }

  xAxisCategorical (args) {
    const svg = utility.getSvgChildOf(args.target)
    let additionalBuffer = 0
    if (args.chartType === 'bar') {
      additionalBuffer = args.buffer + 5
    }

    addColorCategoricalScale(args, 'X', args.categoricalVariables.reverse(), args.left, utility.getPlotRight(args) - additionalBuffer)
    addScaleFunction(args, 'xf', 'X', 'value')
    utility.selectAllAndRemove(svg, '.mg-x-axis')

    const g = utility.addG(svg, 'mg-x-axis')

    if (!args.xAxis) {
      return this
    }

    this.addXAxisCategoricalLabels(g, args, additionalBuffer)
    return this
  }

  addXAxisCategoricalLabels (g, args, additionalBuffer) {
    const labels = g.selectAll('text')
      .data(args.categoricalVariables)
      .enter()
      .append('text')

    labels
      .attr('x', function (d) {
        return args.scales.X(d) + args.scales.X.bandwidth() / 2 + (args.buffer) * args.barOuterPaddingPercentage + (additionalBuffer / 2)
      })
      .attr('y', utility.getPlotBottom(args))
      .attr('dy', '.35em')
      .attr('text-anchor', 'middle')
      .text(String)

    if (args.truncateXLabels) {
      labels.each(function (d, idx) {
        const elem = this; const width = args.scales.X.bandwidth()
        utility.truncateText(elem, d, width)
      })
    }
    utility.rotateLabels(labels, args.rotateXLabels)
  }

  pointAddColorScale (args) {
    let colorDomain, colorRange

    if (args.colorAccessor !== null) {
      colorDomain = this.getColorDomain(args)
      colorRange = this.getColorRange(args)

      if (args.colorType === 'number') {
        args.scales.color = scaleLinear()
          .domain(colorDomain)
          .range(colorRange)
          .clamp(true)
      } else {
        args.scales.color = args.colorRange !== null
          ? scaleOrdinal().range(colorRange)
          : scaleOrdinal(schemeCategory10)

        args.scales.color.domain(colorDomain)
      }
      addScaleFunction(args, 'color', 'color', args.colorAccessor)
    }
  }

  getColorDomain (args) {
    let colorDomain
    if (args.colorDomain === null) {
      if (args.colorType === 'number') {
        colorDomain = extent(args.data[0], function (d) {
          return d[args.colorAccessor]
        })
      } else if (args.colorType === 'category') {
        colorDomain = Array.from(new Set(args.data[0]
          .map(function (d) {
            return d[args.colorAccessor]
          })))

        colorDomain.sort()
      }
    } else {
      colorDomain = args.colorDomain
    }
    return colorDomain
  }

  getColorRange (args) {
    let colorRange
    if (args.colorRange === null) {
      if (args.colorType === 'number') {
        colorRange = ['blue', 'red']
      } else {
        colorRange = null
      }
    } else {
      colorRange = args.colorRange
    }
    return colorRange
  }

  pointAddSizeScale (args) {
    let sizeDomain, sizeRange
    if (args.sizeAccessor !== null) {
      sizeDomain = this.getSizeDomain(args)
      sizeRange = this.getSizeRange(args)

      args.scales.size = scaleLinear()
        .domain(sizeDomain)
        .range(sizeRange)
        .clamp(true)

      addScaleFunction(args, 'size', 'size', args.sizeAccessor)
    }
  }

  getSizeDomain (args) {
    return (args.sizeDomain === null)
      ? extent(args.data[0], function (d) { return d[args.sizeAccessor] })
      : args.sizeDomain
  }

  getSizeRange (args) {
    let sizeRange
    if (args.sizeRange === null) {
      sizeRange = [1, 5]
    } else {
      sizeRange = args.sizeRange
    }
    return sizeRange
  }

  addXLabel (g, args) {
    if (args.xLabel) {
      g.append('text')
        .attr('class', 'label')
        .attr('x', function () {
          return utility.getPlotLeft(args) + (utility.getPlotRight(args) - utility.getPlotLeft(args)) / 2
        })
        .attr('dx', args.xLabelNudgeX != null ? args.xLabelNudgeX : 0)
        .attr('y', function () {
          const xAxisTextElement = select(args.target)
            .select('.mg-x-axis text').node().getBoundingClientRect()
          return utility.getBottom(args) + args.xaxTickLength * (7 / 3) + xAxisTextElement.height * 0.8 + 10
        })
        .attr('dy', '.5em')
        .attr('text-anchor', 'middle')
        .text(function (d) {
          return args.xLabel
        })
    }
  }

  defaultBarXaxFormat (args) {
    return function (d) {
      if (d < 1.0 && d > -1.0 && d !== 0) {
        // don't scale tiny values
        return args.xaxUnits + d.toFixed(args.decimals)
      } else {
        const pf = format(',.0f')
        return args.xaxUnits + pf(d)
      }
    }
  }

  getTimeFrame (diff) {
    // diff should be (maxX - minX) / 1000, in other words, the difference in seconds.
    let timeFrame
    if (this.millisecondDiff(diff)) {
      timeFrame = 'millis'
    } else if (this.secondDiff(diff)) {
      timeFrame = 'seconds'
    } else if (this.dayDiff(diff)) {
      timeFrame = 'less-than-a-day'
    } else if (this.fourDaysDiff(diff)) {
      timeFrame = 'four-days'
    } else if (this.manyDaysDiff(diff)) { // a handful of months?
      timeFrame = 'many-days'
    } else if (this.manyMonthsDiff(diff)) {
      timeFrame = 'many-months'
    } else if (this.yearsDiff(diff)) {
      timeFrame = 'years'
    } else {
      timeFrame = 'default'
    }
    return timeFrame
  }

  millisecondDiff (diff) { return diff < 1 }
  secondDiff (diff) { return diff < 60 }
  dayDiff (diff) { return diff / (60 * 60) < 24 }
  fourDaysDiff (diff) { return diff / (60 * 60) < 24 * 4 }
  manyDaysDiff (diff) { return diff / (60 * 60 * 24) < 60 }
  manyMonthsDiff (diff) { return diff / (60 * 60 * 24) < 365 }
  yearsDiff (diff) { return diff / (60 * 60 * 24) >= 365 }

  getTimeFormat (utc, diff) {
    let mainTimeFormat
    if (this.millisecondDiff(diff)) {
      mainTimeFormat = utility.timeFormat(utc, '%M:%S.%L')
    } else if (this.secondDiff(diff)) {
      mainTimeFormat = utility.timeFormat(utc, '%M:%S')
    } else if (this.dayDiff(diff)) {
      mainTimeFormat = utility.timeFormat(utc, '%H:%M')
    } else if (this.fourDaysDiff(diff) || this.manyDaysDiff(diff)) {
      mainTimeFormat = utility.timeFormat(utc, '%b %d')
    } else if (this.manyMonthsDiff(diff)) {
      mainTimeFormat = utility.timeFormat(utc, '%b')
    } else {
      mainTimeFormat = utility.timeFormat(utc, '%Y')
    }
    return mainTimeFormat
  }

  processTimeFormat ({ min, max, ticks, utcTime }) {
    if (!this.isTimeSeries) return
    const diff = (max - min) / 1000
    const tickDiff = (ticks[1] - ticks[0]) / 1000
    this.timeFrame = this.getTimeFrame(diff)
    this.tickDiffTimeFrame = this.getTimeFrame(tickDiff)
    this.mainTimeFormat = this.getTimeFormat(utcTime, tickDiff)
  }

  defaultXaxFormat ({ data, accessor }) {
    const flattened = data.flat()[0]
    let textPointX = flattened[accessor]
    if (textPointX === undefined) {
      textPointX = flattened
    }

    return function (d) {
      this.processTimeFormat(args)

      if (textPointX instanceof Date) {
        return args.processed.mainXTimeFormat(new Date(d))
      } else if (typeof textPointX === 'number') {
        const isFloat = d % 1 !== 0
        let pf

        if (isFloat) {
          pf = format(',.' + args.decimals + 'f')
        } else if (d < 1000) {
          pf = format(',.0f')
        } else {
          pf = format(',.2s')
        }
        return args.xaxUnits + pf(d)
      } else {
        return args.xaxUnits + d
      }
    }
  }

  addXTicks (g, args) {
    processScaleTicks(args, 'x')
    this.addXAxisRim(args, g)
    this.addXAxisTickLines(args, g)
  }

  addXAxisRim (args, g) {
    const lastI = args.scales.X.ticks(args.xaxCount).length - 1

    if (!args.xExtendedTicks) {
      g.append('line')
        .attr('x1', function () {
          if (args.xaxCount === 0) {
            return utility.getPlotLeft(args)
          } else if (args.axesNotCompact && args.chartType !== 'bar') {
            return args.left
          } else {
            return (args.scales.X(args.scales.X.ticks(args.xaxCount)[0])).toFixed(2)
          }
        })
        .attr('x2', function () {
          if (args.xaxCount === 0 || (args.axesNotCompact && args.chartType !== 'bar')) {
            return utility.getRight(args)
          } else {
            return args.scales.X(args.scales.X.ticks(args.xaxCount)[lastI]).toFixed(2)
          }
        })
        .attr('y1', args.height - args.bottom)
        .attr('y2', args.height - args.bottom)
    }
  }

  addXAxisTickLines (args, g) {
    g.selectAll('.mg-xax-ticks')
      .data(args.processed.xTicks).enter()
      .append('line')
      .attr('x1', function (d) {
        return args.scales.X(d).toFixed(2)
      })
      .attr('x2', function (d) {
        return args.scales.X(d).toFixed(2)
      })
      .attr('y1', args.height - args.bottom)
      .attr('y2', function () {
        return (args.xExtendedTicks) ? args.top : args.height - args.bottom + args.xaxTickLength
      })
      .attr('class', function () {
        if (args.xExtendedTicks) {
          return 'mg-extended-xax-ticks'
        }
      })
      .classed('mg-xax-ticks', true)
  }

  addXTickLabels (g, args) {
    this.addPrimaryXAxisLabel(args, g)
    this.addSecondaryXAxisLabel(args, g)
  }

  addPrimaryXAxisLabel (args, g) {
    const labels = g.selectAll('.mg-xax-labels')
      .data(args.processed.xTicks).enter()
      .append('text')
      .attr('x', function (d) {
        return args.scales.X(d).toFixed(2)
      })
      .attr('y', (args.height - args.bottom + args.xaxTickLength * 7 / 3).toFixed(2))
      .attr('dy', '.50em')
      .attr('text-anchor', 'middle')

    if (args.timeSeries && args.europeanClock) {
      labels.append('tspan').classed('mg-european-hours', true).text(function (_d, i) {
        const d = new Date(_d)
        if (i === 0) return d3TimeFormat('%H')(d)
        else return ''
      })
      labels.append('tspan').classed('mg-european-minutes-seconds', true).text(function (_d, i) {
        const d = new Date(_d)
        return ':' + args.processed.xaxFormat(d)
      })
    } else {
      labels.text(function (d) {
        return args.xaxUnits + args.processed.xaxFormat(d)
      })
    }

    // CHECK TO SEE IF OVERLAP for labels. If so,
    // remove half of them. This is a dirty hack.
    // We will need to figure out a more principled way of doing this.
    if (utility.elementsAreOverlapping(labels)) {
      labels.filter(function (d, i) {
        return (i + 1) % 2 === 0
      }).remove()

      const svg = utility.getSvgChildOf(args.target)
      svg.selectAll('.mg-xax-ticks')
        .filter(function (d, i) {
          return (i + 1) % 2 === 0
        })
        .remove()
    }
  }

  addSecondaryXAxisLabel (args, g) {
    if (args.timeSeries && (args.showYears || args.showSecondaryXLabel)) {
      this.addSecondaryXAxisElements(args, g)
    }
  }

  getYFormatAndSecondaryTimeFunction (args) {
    const tf = {
      timeframe: args.processed.xTimeFrame,
      tickDiffTimeframe: args.processed.xTickDiffTimeFrame
    }
    switch (tf.timeframe) {
      case 'millis':
      case 'seconds':
        tf.secondary = timeDays
        if (args.europeanClock) tf.yFormat = utility.timeFormat(args.utcTime, '%b %d')
        else tf.yFormat = utility.timeFormat(args.utcTime, '%I %p')
        break
      case 'less-than-a-day':
        tf.secondary = timeDays
        tf.yFormat = utility.timeFormat(args.utcTime, '%b %d')
        break
      case 'four-days':
        tf.secondary = timeDays
        tf.yFormat = utility.timeFormat(args.utcTime, '%b %d')
        break
      case 'many-days':
        tf.secondary = timeYears
        tf.yFormat = utility.timeFormat(args.utcTime, '%Y')
        break
      case 'many-months':
        tf.secondary = timeYears
        tf.yFormat = utility.timeFormat(args.utcTime, '%Y')
        break
      default:
        tf.secondary = timeYears
        tf.yFormat = utility.timeFormat(args.utcTime, '%Y')
    }
    return tf
  }

  addSecondaryXAxisElements (args, g) {
    const tf = this.getYFormatAndSecondaryTimeFunction(args)

    let years = tf.secondary(args.processed.minX, args.processed.maxX)
    if (years.length === 0) {
      const firstTick = args.scales.X.ticks(args.xaxCount)[0]
      years = [firstTick]
    }

    const yg = utility.addG(g, 'mg-year-marker')
    if (tf.timeframe === 'default' && args.showYearMarkers) {
      this.addYearMarkerLine(args, yg, years, tf.yFormat)
    }
    if (tf.tickDiffTimeFrame !== 'years') this.addYearMarkerText(args, yg, years, tf.yFormat)
  }

  addYearMarkerLine (args, g, years, yFormat) {
    g.selectAll('.mg-year-marker')
      .data(years).enter()
      .append('line')
      .attr('x1', function (d) {
        return args.scales.X(d).toFixed(2)
      })
      .attr('x2', function (d) {
        return args.scales.X(d).toFixed(2)
      })
      .attr('y1', args.top)
      .attr('y2', utility.getBottom(args))
  }

  addYearMarkerText (args, g, years, yFormat) {
    g.selectAll('.mg-year-marker')
      .data(years).enter()
      .append('text')
      .attr('x', function (d, i) {
        return args.scales.X(d).toFixed(2)
      })
      .attr('y', function () {
        const xAxisTextElement = select(args.target)
          .select('.mg-x-axis text').node().getBoundingClientRect()
        return (utility.getBottom(args) + args.xaxTickLength * 7 / 3) + (xAxisTextElement.height * 0.8)
      })
      .attr('dy', '.50em')
      .attr('text-anchor', 'middle')
      .text(function (d) {
        return yFormat(new Date(d))
      })
  }

  minMaxXForNonBars (mx, args, data) {
    const xExtent = extent(data, function (d) {
      return d[args.xAccessor]
    })
    mx.min = xExtent[0]
    mx.max = xExtent[1]
  }

  minMaxXForBars (mx, args, data) {
    mx.min = min(data, function (d) {
      const trio = [
        d[args.xAccessor],
        (d[args.baselineAccessor]) ? d[args.baselineAccessor] : 0,
        (d[args.predictorAccessor]) ? d[args.predictorAccessor] : 0
      ]
      return Math.min.apply(null, trio)
    })

    if (mx.min > 0) mx.min = 0

    mx.max = max(data, function (d) {
      const trio = [
        d[args.xAccessor],
        (d[args.baselineAccessor]) ? d[args.baselineAccessor] : 0,
        (d[args.predictorAccessor]) ? d[args.predictorAccessor] : 0
      ]
      return Math.max.apply(null, trio)
    })
    return mx
  }

  minMaxXForDates (mx) {
    const yesterday = utility.clone(mx.min).setDate(mx.min.getDate() - 1)
    const tomorrow = utility.clone(mx.min).setDate(mx.min.getDate() + 1)
    mx.min = yesterday
    mx.max = tomorrow
  }

  minMaxXForNumbers (mx) {
    // TODO do we want to rewrite this?
    mx.min = mx.min - 1
    mx.max = mx.max + 1
  }

  minMaxXForStrings (mx) {
    // TODO shouldn't be allowing strings here to be coerced into numbers
    mx.min = Number(mx.min) - 1
    mx.max = Number(mx.max) + 1
  }

  forceXaxCountToBeTwo (args) { args.xaxCount = 2 }
}
