import { clone } from './utility'
import { leastSquares } from './smoothers'
import { histogram } from 'd3-array'
import { getTimeFrame } from '../common/xAxis'

export function processScaleTicks (args, axis) {
  let accessor
  let scaleTicks
  let max

  if (axis === 'x') {
    accessor = args.xAccessor
    scaleTicks = args.scales.X.ticks(args.xaxCount)
    max = args.processed.maxX
  } else if (axis === 'y') {
    accessor = args.yAccessor
    scaleTicks = args.scales.Y.ticks(args.yax_count)
    max = args.processed.maxY
  }

  function log10 (val) {
    return val === 1000 ? 3 : val === 1000000 ? 7 : Math.log(val) / Math.LN10
  }

  if ((axis === 'x' && args.xScaleType === 'log') || (axis === 'y' && args.yScaleType === 'log')) {
    // get out only whole logs
    scaleTicks = scaleTicks.filter(d => Math.abs(log10(d)) % 1 < 1e-6 || Math.abs(log10(d)) % 1 > 1 - 1e-6)
  }

  // filter out fraction ticks if our data is ints and if xmax > number of generated ticks
  const numberOfTicks = scaleTicks.length

  // is our data object all ints?
  const dataIsInt = args.data.every(a => a.every(d => Number.isInteger(d[accessor])))

  if (dataIsInt && numberOfTicks > max && args.format === 'count') {
    // remove non-integer ticks
    scaleTicks = scaleTicks.filter(d => Number.isInteger(d))
  }

  if (axis === 'x') {
    args.processed.xTicks = scaleTicks
  } else if (axis === 'y') {
    args.processed.yTicks = scaleTicks
  }
}

export function rawDataTransformation (args) {
  if (args.chartType === 'line' && (args.arrayOfObjects || args.arrayOfArrays)) {
    args.data = [args.data]
  } else if (!Array.isArray(args.data[0])) {
    args.data = [args.data]
  }
  // if the yAccessor is an array, break it up and store the result in args.data
  processMultipleXAccessors(args)
  processMultipleYAccessors(args)

  // if user supplies keyword in args.color, change to arg.colors.
  // this is so that the API remains fairly sensible and legible.
  if (args.color !== undefined) args.colors = args.color

  // if user has supplied args.colors, and that value is a string, turn it into an array.
  if (args.colors !== null && typeof args.colors === 'string') args.colors = [args.colors]

  return args
}

export function processMultipleAccessors (args, whichAccessor) {
  // turns an array of accessors into ...
  if (!Array.isArray(args[whichAccessor])) return
  args.data = args.data.map(data => args[whichAccessor].map(accessor => data.map(dataEntry => {
    dataEntry = clone(dataEntry)

    if (dataEntry[accessor] === undefined) return undefined

    dataEntry[`multiline_${whichAccessor}`] = dataEntry[accessor]
    return dataEntry
  }).filter(d => d !== undefined)))[0]
  args[whichAccessor] = `multiline_${whichAccessor}`
}

export function processMultipleXAccessors (args) {
  processMultipleAccessors(args, 'xAccessor')
}

export function processMultipleYAccessors (args) {
  processMultipleAccessors(args, 'yAccessor')
}

export function processHistogram (args) {
  // if args.binned == false, then we need to bin the data appropriately.
  // if args.binned == true, then we need to make sure to compute the relevant computed data.
  // the outcome of either of these should be something in args.computed_data.
  // the histogram plotting function will be looking there for the data to plot.

  // we need to compute an array of objects.
  // each object has an x, y, and dx.

  // histogram data is always single dimension
  const ourData = args.data[0]

  let extractedData
  if (args.binned === false) {
    // use d3's built-in layout.histogram functionality to compute what you need.

    if (typeof (ourData[0]) === 'object') {
      // we are dealing with an array of objects. Extract the data value of interest.
      extractedData = ourData.map(d => d[args.xAccessor])
    } else if (typeof (ourData[0]) === 'number') {
      // we are dealing with a simple array of numbers. No extraction needed.
      extractedData = ourData
    } else {
      console.log('TypeError: expected an array of numbers, found ' + typeof (ourData[0]))
      return
    }

    const hist = histogram()
    if (args.bins) hist.thresholds(args.bins)

    const bins = hist(extractedData)
    args.processedData = bins.map(d => ({ x: d.x0, y: d.length }))
  } else {
    // here, we just need to reconstruct the array of objects
    // take the x accessor and y accessor.
    // pull the data as x and y. y is count.

    args.processedData = ourData.map(d => ({ x: d[args.xAccessor], y: d[args.yAccessor] }))

    let thisPt
    let nextPt

    // we still need to compute the dx component for each data point
    for (let i = 0; i < args.processedData.length; i++) {
      thisPt = args.processedData[i]
      if (i === args.processedData.length - 1) {
        thisPt.dx = args.processedData[i - 1].dx
      } else {
        nextPt = args.processedData[i + 1]
        thisPt.dx = nextPt.x - thisPt.x
      }
    }
  }

  // capture the original data and accessors before replacing args.data
  if (!args.processed) {
    args.processed = {}
  }
  args.processed.originalData = args.data
  args.processed.originalXAccessor = args.xAccessor
  args.processed.original_yAccessor = args.yAccessor

  args.data = [args.processedData]
  args.xAccessor = args.processed_xAccessor
  args.yAccessor = args.processed_yAccessor

  return this
}

export function processPoint (args) {
  const data = args.data[0]
  const x = data.map(d => d[args.xAccessor])
  const y = data.map(d => d[args.yAccessor])
  if (args.leastSquares) args.lsLine = leastSquares(x, y)
}
