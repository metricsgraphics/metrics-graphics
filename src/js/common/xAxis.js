import * as utility from '../misc/utility'
import { max, min, extent } from 'd3-array'
import { select } from 'd3-selection'
import { timeDays, timeYears } from 'd3-time'
import { timeFormat as d3TimeFormat } from 'd3-time-format'
import { processScaleTicks } from '../misc/process'
import { format } from 'd3-format'
import { scaleLinear, scaleOrdinal } from 'd3-scale'
import { schemeCategory10, schemeCategory20 } from 'd3-scale-chromatic'
import { addScaleFunction, addColorCategoricalScale } from './scales'

export function xRug (args) {
  if (!args.xRug) return

  args.rugBufferSize = args.chartType === 'point'
    ? args.buffer / 2
    : args.buffer

  const rug = utility.makeRug(args, 'mg-x-rug')

  rug.attr('x1', args.scaleFunctions.xf)
    .attr('x2', args.scaleFunctions.xf)
    .attr('y1', args.height - args.bottom - args.rugBufferSize)
    .attr('y2', args.height - args.bottom)

  utility.addColorAccessorToRug(rug, args, 'mg-x-rug-mono')
}

export function addProcessedObject (args) { if (!args.processed) args.processed = {} }

// TODO ought to be deprecated, only used by histogram
export function xAxis (args) {
  const svg = utility.getSvgChildOf(args.target)
  addProcessedObject(args)

  selectXaxFormat(args)
  utility.selectAllAndRemove(svg, '.mg-x-axis')

  if (!args.xAxis) {
    return this
  }

  const g = utility.addG(svg, 'mg-x-axis')

  addXTicks(g, args)
  addXTickLabels(g, args)
  if (args.xLabel) { addXLabel(g, args) }
  if (args.xRug) { xRug(args) }

  return this
}

export function xAxisCategorical (args) {
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

  addXAxisCategoricalLabels(g, args, additionalBuffer)
  return this
}

export function addXAxisCategoricalLabels (g, args, additionalBuffer) {
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

export function pointAddColorScale (args) {
  let colorDomain, colorRange

  if (args.colorAccessor !== null) {
    colorDomain = getColorDomain(args)
    colorRange = getColorRange(args)

    if (args.colorType === 'number') {
      args.scales.color = scaleLinear()
        .domain(colorDomain)
        .range(colorRange)
        .clamp(true)
    } else {
      args.scales.color = args.colorRange !== null
        ? scaleOrdinal().range(colorRange)
        : (colorDomain.length > 10
          ? scaleOrdinal(schemeCategory20)
          : scaleOrdinal(schemeCategory10))

      args.scales.color.domain(colorDomain)
    }
    addScaleFunction(args, 'color', 'color', args.colorAccessor)
  }
}

export function getColorDomain (args) {
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

export function getColorRange (args) {
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

export function pointAddSizeScale (args) {
  let sizeDomain, sizeRange
  if (args.sizeAccessor !== null) {
    sizeDomain = getSizeDomain(args)
    sizeRange = getSizeRange(args)

    args.scales.size = scaleLinear()
      .domain(sizeDomain)
      .range(sizeRange)
      .clamp(true)

    addScaleFunction(args, 'size', 'size', args.sizeAccessor)
  }
}

export function getSizeDomain (args) {
  return (args.sizeDomain === null)
    ? extent(args.data[0], function (d) { return d[args.sizeAccessor] })
    : args.sizeDomain
}

export function getSizeRange (args) {
  let sizeRange
  if (args.sizeRange === null) {
    sizeRange = [1, 5]
  } else {
    sizeRange = args.sizeRange
  }
  return sizeRange
}

export function addXLabel (g, args) {
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

export function defaultBarXaxFormat (args) {
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

export function getTimeFrame (diff) {
  // diff should be (maxX - minX) / 1000, in other words, the difference in seconds.
  let timeFrame
  if (millisecondDiff(diff)) {
    timeFrame = 'millis'
  } else if (secondDiff(diff)) {
    timeFrame = 'seconds'
  } else if (dayDiff(diff)) {
    timeFrame = 'less-than-a-day'
  } else if (fourDaysDiff(diff)) {
    timeFrame = 'four-days'
  } else if (manyDaysDiff(diff)) { // a handful of months?
    timeFrame = 'many-days'
  } else if (manyMonthsDiff(diff)) {
    timeFrame = 'many-months'
  } else if (yearsDiff(diff)) {
    timeFrame = 'years'
  } else {
    timeFrame = 'default'
  }
  return timeFrame
}

export function millisecondDiff (diff) {
  return diff < 1
}

export function secondDiff (diff) {
  return diff < 60
}

export function dayDiff (diff) {
  return diff / (60 * 60) < 24
}

export function fourDaysDiff (diff) {
  return diff / (60 * 60) < 24 * 4
}

export function manyDaysDiff (diff) {
  return diff / (60 * 60 * 24) < 60
}

export function manyMonthsDiff (diff) {
  return diff / (60 * 60 * 24) < 365
}

export function yearsDiff (diff) {
  return diff / (60 * 60 * 24) >= 365
}

export function getTimeFormat (utc, diff) {
  let mainTimeFormat
  if (millisecondDiff(diff)) {
    mainTimeFormat = utility.timeFormat(utc, '%M:%S.%L')
  } else if (secondDiff(diff)) {
    mainTimeFormat = utility.timeFormat(utc, '%M:%S')
  } else if (dayDiff(diff)) {
    mainTimeFormat = utility.timeFormat(utc, '%H:%M')
  } else if (fourDaysDiff(diff) || manyDaysDiff(diff)) {
    mainTimeFormat = utility.timeFormat(utc, '%b %d')
  } else if (manyMonthsDiff(diff)) {
    mainTimeFormat = utility.timeFormat(utc, '%b')
  } else {
    mainTimeFormat = utility.timeFormat(utc, '%Y')
  }
  return mainTimeFormat
}

export function processTimeFormat (args) {
  if (args.timeSeries) {
    const diff = (args.processed.maxX - args.processed.minX) / 1000
    const tickDiff = (args.processed.xTicks[1] - args.processed.xTicks[0]) / 1000
    args.processed.xTimeFrame = getTimeFrame(diff)
    args.processed.xTickDiffTimeFrame = getTimeFrame(tickDiff)
    args.processed.mainXTimeFormat = getTimeFormat(args.utcTime, tickDiff)
  }
}

export function defaultXaxFormat (args) {
  if (args.xaxFormat) {
    return args.xaxFormat
  }

  const data = args.processed.originalData || args.data
  const flattened = data.flat()[0]
  let textPointX = flattened[args.processed.originalXAccessor || args.xAccessor]
  if (textPointX === undefined) {
    textPointX = flattened
  }

  return function (d) {
    processTimeFormat(args)

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

export function addXTicks (g, args) {
  processScaleTicks(args, 'x')
  addXAxisRim(args, g)
  addXAxisTickLines(args, g)
}

export function addXAxisRim (args, g) {
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

export function addXAxisTickLines (args, g) {
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

export function addXTickLabels (g, args) {
  addPrimaryXAxisLabel(args, g)
  addSecondaryXAxisLabel(args, g)
}

export function addPrimaryXAxisLabel (args, g) {
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

export function addSecondaryXAxisLabel (args, g) {
  if (args.timeSeries && (args.showYears || args.showSecondaryXLabel)) {
    addSecondaryXAxisElements(args, g)
  }
}

export function getYFormatAndSecondaryTimeFunction (args) {
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

export function addSecondaryXAxisElements (args, g) {
  const tf = getYFormatAndSecondaryTimeFunction(args)

  let years = tf.secondary(args.processed.minX, args.processed.maxX)
  if (years.length === 0) {
    const firstTick = args.scales.X.ticks(args.xaxCount)[0]
    years = [firstTick]
  }

  const yg = utility.addG(g, 'mg-year-marker')
  if (tf.timeframe === 'default' && args.showYearMarkers) {
    addYearMarkerLine(args, yg, years, tf.yFormat)
  }
  if (tf.tickDiffTimeFrame !== 'years') addYearMarkerText(args, yg, years, tf.yFormat)
}

export function addYearMarkerLine (args, g, years, yFormat) {
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

export function addYearMarkerText (args, g, years, yFormat) {
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

export function minMaxXForNonBars (mx, args, data) {
  const xExtent = extent(data, function (d) {
    return d[args.xAccessor]
  })
  mx.min = xExtent[0]
  mx.max = xExtent[1]
}

export function minMaxXForBars (mx, args, data) {
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

export function minMaxXForDates (mx) {
  const yesterday = utility.clone(mx.min).setDate(mx.min.getDate() - 1)
  const tomorrow = utility.clone(mx.min).setDate(mx.min.getDate() + 1)
  mx.min = yesterday
  mx.max = tomorrow
}

export function minMaxXForNumbers (mx) {
  // TODO do we want to rewrite this?
  mx.min = mx.min - 1
  mx.max = mx.max + 1
}

export function minMaxXForStrings (mx) {
  // TODO shouldn't be allowing strings here to be coerced into numbers
  mx.min = Number(mx.min) - 1
  mx.max = Number(mx.max) + 1
}

export function forceXaxCountToBeTwo (args) {
  args.xaxCount = 2
}

export function selectXaxFormat (args) {
  const c = args.chartType
  if (!args.processed.xaxFormat) {
    if (args.xaxFormat) {
      args.processed.xaxFormat = args.xaxFormat
    } else {
      if (c === 'line' || c === 'point' || c === 'histogram') {
        args.processed.xaxFormat = defaultXaxFormat(args)
      } else if (c === 'bar') {
        args.processed.xaxFormat = defaultBarXaxFormat(args)
      }
    }
  }
}
