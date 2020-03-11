import { isArrayOfArrays } from '../misc/utility'
import { min, max } from 'd3'
import { createBrushingPattern, removeBrushingPattern } from './brush'

export function filterInRangeData (args, range) {
  const isDataInRange = (data, range) => data > min(range) && data < max(range)

  // if range without this axis return true, else judge is data in range or not.
  return d => ['x', 'y'].every(dim => !(dim in range) || isDataInRange(d[args[`${dim}_accessor`]], range[dim]))
}

// the range here is the range of data
// range is an object with two optional attributes of x,y, respectively represent ranges on two axes
export function zoomToDataDomain (args, range) {
  const rawData = args.processed.rawData || args.data

  // store raw data and raw domain to in order to zoom back to the initial state
  if (!('rawData' in args.processed)) {
    args.processed.rawDomain = {
      x: args.scales.X.domain(),
      y: args.scales.Y.domain()
    }
    args.processed.rawData = rawData
  }

  if (['x', 'y'].some(dim => range[dim][0] === range[dim][1])) return

  // to avoid drawing outside the chart in the point chart, unnecessary in line chart.
  if (args.chartType === 'point') {
    args.data = isArrayOfArrays(rawData)
      ? rawData.map(d => d.filter(filterInRangeData(args, range)))
      : rawData.filter(filterInRangeData(args, range))
    if (args.data.flat().length === 0) return
  }
  ['x', 'y'].forEach(dim => {
    if (dim in range) args.processed[`zoom_${dim}`] = range[dim]
    else delete args.processed[`zoom_${dim}`]
  })
  if (args.processed.subplot) {
    if (range !== args.processed.rawDomain) {
      createBrushingPattern(args.processed.subplot, convertDomainToRange(args.processed.subplot, range))
    } else {
      removeBrushingPattern(args.processed.subplot)
    }
  }
  // new charts[args.chartType || defaults.chartType].descriptor(args)
}

export function zoomToRawRange (args) {
  if (!('rawDomain' in args.processed)) return
  zoomToDataDomain(args, args.processed.rawDomain)
  delete args.processed.rawDomain
  delete args.processed.rawData
}

// converts the range of selection into the range of data that we can use to
// zoom the chart to a particular region
export function convertRangeToDomain (args, range) {
  return ['x', 'y'].reduce((domain, dim) => {
    if (!(dim in range)) return domain
    domain[dim] = range[dim].map(v => +args.scales[dim.toUpperCase()].invert(v))
    if (dim === 'y') domain[dim].reverse()
    return domain
  }, {})
}

export function convertDomainToRange (args, domain) {
  return ['x', 'y'].reduce((range, dim) => {
    if (!(dim in domain)) return range
    range[dim] = domain[dim].map(v => +args.scales[dim.toUpperCase()](v))
    if (dim === 'y') range[dim].reverse()
    return range
  }, {})
}

// the range here is the range of selection
export function zoomToDataRange (args, range) {
  const domain = convertRangeToDomain(args, range)
  zoomToDataDomain(args, domain)
}
