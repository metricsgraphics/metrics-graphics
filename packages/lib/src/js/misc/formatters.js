import { format } from 'd3'
import { getRolloverTimeFormat, timeFormat } from './utility'
import constants from './constants'

export function formatRolloverNumber ({ format, decimals, yaxUnitsAppend, yaxUnits }) {
  if (format === constants.format.count) {
    return d => {
      const pf = d % 1 !== 0 ? format(`,.${decimals}f`) : format(',.0f')

      // are we adding units after the value or before?
      return yaxUnitsAppend ? pf(d) + yaxUnits : yaxUnits + pf(d)
    }
  } else {
    return d => {
      const fmtString = Number.isInteger(decimals) ? `.${decimals}%` : '%'
      const pf = format(fmtString)
      return pf(d)
    }
  }
}

export function timeRolloverFormat (f, d, accessor, utc) {
  if (typeof f === 'string') {
    return timeFormat(utc, f)(d[accessor])
  } else if (typeof f === 'function') {
    return f(d)
  }
  return d[accessor]
}

// define our rollover format for numbers
export function numberRolloverFormat (f, d, accessor) {
  if (typeof f === 'string') {
    return format('s')(d[accessor])
  } else if (typeof f === 'function') {
    return f(d)
  }
  return d[accessor]
}

export function formatYRollover ({ num, d, mouseover, accessor, isTimeSeries, aggregateRollover, units, name }) {
  let formattedY
  if (mouseover !== null) {
    formattedY = numberRolloverFormat(mouseover, d, accessor)
  } else {
    if (isTimeSeries) {
      formattedY = aggregateRollover
        ? num(accessor(d))
        : units + num(accessor(d))
    } else {
      formattedY = name + ': ' + units + num(accessor(d))
    }
  }
  return formattedY
}

export function formatXRollover ({ data, fmt, d, mouseover, isTimeSeries, utc, accessor, aggregateRollover, name }) {
  let formattedX
  if (mouseover !== null) {
    if (isTimeSeries) {
      formattedX = aggregateRollover
        ? timeRolloverFormat(mouseover, d, 'key', utc)
        : timeRolloverFormat(mouseover, d, accessor, utc)
    } else {
      formattedX = numberRolloverFormat(mouseover, d, accessor)
    }
  } else {
    if (isTimeSeries) {
      let date

      if (aggregateRollover && data.length > 1) {
        date = new Date(d.key)
      } else {
        date = new Date(+accessor(d))
        date.setDate(date.getDate())
      }

      formattedX = fmt(date) + '  '
    } else {
      formattedX = name + ': ' + accessor(d) + '   '
    }
  }
  return formattedX
}

export function formatDataForMouseover ({ rolloverTimeFormat, utcTime, timeFrame, d, mouseoverFunction, accessor, checkTime, decimals, yaxUnitsAppend, yaxUnits, isTimeSeries }) {
  const timeFmt = getRolloverTimeFormat({ rolloverTimeFormat, utcTime, timeFrame })
  const formatter = typeof accessor(d) === 'string'
    ? d => d
    : formatRolloverNumber({ format, decimals, yaxUnitsAppend, yaxUnits })

  let formattedData
  if (mouseoverFunction !== null) {
    formattedData = checkTime
      ? timeRolloverFormat(mouseoverFunction, d, accessor, utcTime)
      : numberRolloverFormat(mouseoverFunction, d, accessor)
  } else {
    formattedData = checkTime
      ? timeFmt(new Date(+d[accessor])) + '  '
      : (isTimeSeries ? '' : accessor + ': ') + formatter(d[accessor]) + '   '
  }
  return formattedData
}

export function formatNumberMouseover (args, d) {
  return formatDataForMouseover(args, d, args.xMouseover, args.xAccessor, false)
}

export function formatXMouseover (args, d) {
  return formatDataForMouseover(args, d, args.xMouseover, args.xAccessor, args.timeSeries)
}

export function formatYMouseover (args, d) {
  return formatDataForMouseover(args, d, args.yMouseover, args.yAccessor, false)
}

export function formatXAggregateMouseover (args, d) {
  return formatDataForMouseover(args, d, args.xMouseover, 'key', args.timeSeries)
}
