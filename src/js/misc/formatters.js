import { format } from 'd3-format'
import { getRolloverTimeFormat, timeFormat } from './utility'

export function formatRolloverNumber (args) {
  if (args.format === 'count') {
    return d => {
      const pf = d % 1 !== 0 ? format(',.' + args.decimals + 'f') : format(',.0f')

      // are we adding units after the value or before?
      return args.yaxUnitsAppend ? pf(d) + args.yaxUnits : args.yaxUnits + pf(d)
    }
  } else {
    return d => {
      const fmtString = (Number.isInteger(args.decimals) ? '.' + args.decimals : '') + '%'
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

export function formatYRollover (args, num, d) {
  let formattedY
  if (args.yMouseover !== null) {
    formattedY = numberRolloverFormat(args.yMouseover, d, args.yAccessor)
  } else {
    if (args.timeSeries) {
      formattedY = args.aggregateRollover
        ? num(d[args.yAccessor])
        : args.yaxUnits + num(d[args.yAccessor])
    } else {
      formattedY = args.yAccessor + ': ' + args.yaxUnits + num(d[args.yAccessor])
    }
  }
  return formattedY
}

export function formatXRollover (args, fmt, d) {
  let formattedX
  if (args.xMouseover !== null) {
    if (args.timeSeries) {
      formattedX = args.aggregateRollover
        ? timeRolloverFormat(args.xMouseover, d, 'key', args.utc)
        : timeRolloverFormat(args.xMouseover, d, args.xAccessor, args.utc)
    } else {
      formattedX = numberRolloverFormat(args.xMouseover, d, args.xAccessor)
    }
  } else {
    if (args.timeSeries) {
      let date

      if (args.aggregateRollover && args.data.length > 1) {
        date = new Date(d.key)
      } else {
        date = new Date(+d[args.xAccessor])
        date.setDate(date.getDate())
      }

      formattedX = fmt(date) + '  '
    } else {
      formattedX = args.xAccessor + ': ' + d[args.xAccessor] + '   '
    }
  }
  return formattedX
}

export function formatDataForMouseover (args, d, mouseoverFunction, accessor, checkTime) {
  const timeFmt = getRolloverTimeFormat(args)
  const formatter = typeof d[accessor] === 'string'
    ? d => d
    : formatRolloverNumber(args)

  let formattedData
  if (mouseoverFunction !== null) {
    formattedData = checkTime
      ? timeRolloverFormat(mouseoverFunction, d, accessor, args.utc)
      : numberRolloverFormat(mouseoverFunction, d, accessor)
  } else {
    formattedData = checkTime
      ? timeFmt(new Date(+d[accessor])) + '  '
      : (args.timeSeries ? '' : accessor + ': ') + formatter(d[accessor]) + '   '
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
