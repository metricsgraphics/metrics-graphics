import { leastSquares } from './smoothers'
import { histogram } from 'd3-array'
import constants from './constants'

export function processScaleTicks ({ data, axis, xAccessor, yAccessor, xScale, yScale, xaxCount, yaxCount, maxX, maxY, xScaleType, yScaleType, format }) {
  const accessor = axis === 'x' ? xAccessor : yAccessor
  let scaleTicks = axis === 'x' ? xScale.ticks(xaxCount) : yScale.ticks(yaxCount)
  const max = axis === 'x' ? maxX : maxY

  function log10 (val) {
    return val === 1000 ? 3 : val === 1000000 ? 7 : Math.log(val) / Math.LN10
  }

  if ((axis === 'x' && xScaleType === constants.scaleType.log) || (axis === 'y' && yScaleType === constants.scaleType.log)) {
    // get out only whole logs
    scaleTicks = scaleTicks.filter(d => Math.abs(log10(d)) % 1 < 1e-6 || Math.abs(log10(d)) % 1 > 1 - 1e-6)
  }

  // filter out fraction ticks if our data is ints and if xmax > number of generated ticks
  const numberOfTicks = scaleTicks.length

  // is our data object all ints?
  const dataIsInt = data.every(a => a.every(d => Number.isInteger(d[accessor])))

  if (dataIsInt && numberOfTicks > max && format === 'count') {
    // remove non-integer ticks
    scaleTicks = scaleTicks.filter(d => Number.isInteger(d))
  }

  return scaleTicks
  // if (axis === 'x') {
  //   processed.xTicks = scaleTicks
  // } else if (axis === 'y') {
  //   processed.yTicks = scaleTicks
  // }
}

export function processHistogram ({ data, binned, bins, xAccessor, yAccessor }) {
  // if binned == false, then we need to bin the data appropriately.
  // if binned == true, then we need to make sure to compute the relevant computed data.
  // the outcome of either of these should be something in computed_data.
  // the histogram plotting function will be looking there for the data to plot.

  // we need to compute an array of objects.
  // each object has an x, y, and dx.

  // histogram data is always single dimension
  const ourData = data[0]

  let extractedData
  let processedData
  if (!binned) {
    // use d3's built-in layout.histogram functionality to compute what you need.

    if (typeof (ourData[0]) === 'object') {
      // we are dealing with an array of objects. Extract the data value of interest.
      extractedData = ourData.map(xAccessor)
    } else if (typeof (ourData[0]) === 'number') {
      // we are dealing with a simple array of numbers. No extraction needed.
      extractedData = ourData
    } else {
      console.log('TypeError: expected an array of numbers, found ' + typeof (ourData[0]))
      return
    }

    const hist = histogram()
    if (bins) hist.thresholds(bins)

    bins = hist(extractedData)
    processedData = bins.map(d => ({ x: d.x0, y: d.length }))
  } else {
    // here, we just need to reconstruct the array of objects
    // take the x accessor and y accessor.
    // pull the data as x and y. y is count.

    processedData = ourData.map(d => ({ x: xAccessor(d), y: yAccessor(d) }))

    let thisPt
    let nextPt

    // we still need to compute the dx component for each data point
    for (let i = 0; i < processedData.length; i++) {
      thisPt = processedData[i]
      if (i === processedData.length - 1) {
        thisPt.dx = processedData[i - 1].dx
      } else {
        nextPt = processedData[i + 1]
        thisPt.dx = nextPt.x - thisPt.x
      }
    }
  }

  return [processedData]
}

export function processPoint ({ data, xAccessor, yAccessor, useLeastSquares }) {
  data = data[0]
  const x = data.map(xAccessor)
  const y = data.map(yAccessor)
  if (useLeastSquares) return leastSquares(x, y)
  // lsLine = leastSquares(x, y)
}
