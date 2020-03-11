import { extent, scaleOrdinal, scaleUtc, scaleTime, scaleLog, scaleLinear, scaleBand, schemeCategory10 } from 'd3'
import { getPlotRight, getPlotLeft, getPlotBottom, getPlotTop, clone } from '../misc/utility'
import { forceXaxCountToBeTwo } from '../axis/xAxis'
import { callHook } from './hooks'

export function addScaleFunction (args, scaleFunctionName, scale, accessor, inflation) {
  args.scaleFunctions[scaleFunctionName] = function (di) {
    if (inflation === undefined) return args.scales[scale](di[accessor])
    else return args.scales[scale](di[accessor]) + inflation
  }
}

export function position (str, args) {
  if (str === 'bottom' || str === 'top') {
    return [getPlotLeft(args), getPlotRight(args)]
  }

  if (str === 'left' || str === 'right') {
    return [getPlotBottom(args), args.top]
  }
}

export function catPosition (str, args) {
  if (str === 'bottom' || str === 'top') {
    return [getPlotLeft(args), getPlotRight(args)]
  }

  if (str === 'left' || str === 'right') {
    return [getPlotBottom(args), getPlotTop(args)]
  }
}

// big wrapper around d3 scale that automatically formats & calculates scale bounds
// according to the data, and handles other niceties.
export class MGScale {
  constructor (args) {
    this.args = args
    this.scaleArgs = {
      useInflator: false,
      zeroBottom: false,
      scaleType: 'numerical'
    }
  }

  namespace (namespace) {
    this.scaleArgs.namespace = namespace
    this.scaleArgs.namespaceAccessorName = this.scaleArgs.namespace + 'Accessor'
    this.scaleArgs.scaleName = this.scaleArgs.namespace.toUpperCase()
    this.scaleArgs.scaleFunctionName = this.scaleArgs.namespace + 'f'
  }

  scaleName (scaleName) {
    this.scaleArgs.scaleName = scaleName.toUpperCase()
    this.scaleArgs.scaleFunctionName = scaleName + 'f'
  }

  inflateDomain (tf) { this.scaleArgs.useInflator = tf }
  zeroBottom (tf) { this.scaleArgs.zeroBottom = tf }

  numericalDomainFromData () {
    let otherFlatDataArrays = []

    if (arguments.length > 0) otherFlatDataArrays = arguments

    // pull out a non-empty array in args.data.
    const illustrativeData = this.args.data.find(d => d.length > 0)

    this.scaleArgs.isTimeSeries = !!(illustrativeData[0][this.args[this.scaleArgs.namespaceAccessorName]] instanceof Date)

    addScaleFunction(this.args, this.scaleArgs.scaleFunctionName, this.scaleArgs.scaleName, this.args[this.scaleArgs.namespaceAccessorName])

    minMaxNumerical(this.args, this.scaleArgs, otherFlatDataArrays, this.scaleArgs.useInflator)

    const timeScale = this.args.utcTime ? scaleUtc() : scaleTime()

    this.args.scales[this.scaleArgs.scaleName] = (this.scaleArgs.isTimeSeries)
      ? timeScale
      : (typeof this.args[this.scaleArgs.namespace + 'ScaleType'] === 'function')
        ? this.args.yScaleType()
        : (this.args[this.scaleArgs.namespace + 'ScaleType'] === 'log')
          ? scaleLog()
          : scaleLinear()

    this.args.scales[this.scaleArgs.scaleName].domain([this.args.processed['min_' + this.scaleArgs.namespace], this.args.processed['max_' + this.scaleArgs.namespace]])
    this.scaleArgs.scaleType = 'numerical'
  }

  categoricalDomain (domain) {
    this.args.scales[this.scaleArgs.scaleName] = scaleOrdinal().domain(domain)
    addScaleFunction(this.args, this.scaleArgs.scaleFunctionName, this.scaleArgs.scaleName, this.args[this.scaleArgs.namespaceAccessorName])
  }

  categoricalDomainFromData () {
    // make args.categoricalVariables.
    // lets make the categoricallet iables.
    const allData = this.args.data.flat()
    // d3.set(data.map(function(d){return d[args.group_accessor]})).values()
    this.scaleArgs.categoricalVariables = Array.from(new Set(allData.map(function (d) {
      return d[this.args[this.scaleArgs.namespaceAccessorName]]
    })))
    this.args.scales[this.scaleArgs.scaleName] = scaleBand()
      .domain(this.scaleArgs.categoricalVariables)

    this.scaleArgs.scaleType = 'categorical'
  }

  numericalRange (range) {
    if (typeof range === 'string') {
      this.args
        .scales[this.scaleArgs.scaleName]
        .range(position(range, this.args))
    } else {
      this.args
        .scales[this.scaleArgs.scaleName]
        .range(range)
    }
  }

  categoricalRangeBands (range, halfway) {
    if (halfway === undefined) halfway = false

    const namespace = this.scaleArgs.namespace
    const paddingPercentage = this.args[namespace + '_padding_percentage']
    const outerPaddingPercentage = this.args[namespace + '_outer_padding_percentage']
    if (typeof range === 'string') {
      // if string, it's a location. Place it accordingly.
      this.args.scales[this.scaleArgs.scaleName]
        .range(position(range, this.args))
        .paddingInner(paddingPercentage)
        .paddingOuter(outerPaddingPercentage)
    } else {
      this.args.scales[this.scaleArgs.scaleName]
        .range(range)
        .paddingInner(paddingPercentage)
        .paddingOuter(outerPaddingPercentage)
    }

    addScaleFunction(
      this.args,
      this.scaleArgs.scaleFunctionName,
      this.scaleArgs.scaleName,
      this.args[this.scaleArgs.namespaceAccessorName],
      halfway
        ? this.args.scales[this.scaleArgs.scaleName].bandwidth() / 2
        : 0
    )
  }

  categoricalRange (range) {
    this.args.scales[this.scaleArgs.scaleName].range(range)
    addScaleFunction(this.args, this.scaleArgs.scaleFunctionName, this.scaleArgs.scaleName, this.args[this.scaleArgs.namespaceAccessorName])
  }

  categoricalColorRange () {
    this.args.scales[this.scaleArgs.scaleName] = scaleOrdinal(schemeCategory10)

    this.args
      .scales[this.scaleArgs.scaleName]
      .domain(this.scaleArgs.categoricalVariables)

    addScaleFunction(this.args, this.scaleArgs.scaleFunctionName, this.scaleArgs.scaleName, this.args[this.scaleArgs.namespaceAccessorName])
  }

  clamp (yn) { this.args.scales[this.scaleArgs.scaleName].clamp(yn) }
}

/// //////////////////////////// x, xAccessor, markers, baselines, etc.
export function minMaxNumerical (args, scaleArgs, additionalDataArrays) {
  // A BIT OF EXPLANATION ABOUT THIS FUNCTION
  // This function pulls out all the accessor values in all the arrays in args.data.
  // We also have this additional argument, additionalDataArrays, which is an array of arrays of raw data values.
  // These values also get concatenated to the data pulled from args.data, and the extents are calculate from that.
  // They are optional.
  //
  // This may seem arbitrary, but it gives us a lot of flexibility. For instance, if we're calculating
  // the min and max for the y axis of a line chart, we're going to want to also factor in baselines (horizontal lines
  // that might potentially be outside of the y value bounds). The easiest way to do this is in the line.js code
  // & scale creation to just flatten the args.baselines array, pull out hte values, and feed it in
  // so it appears in additionalDataArrays.
  const namespace = scaleArgs.namespace
  const namespaceAccessorName = scaleArgs.namespaceAccessorName
  const useInflator = scaleArgs.useInflator
  const zeroBottom = scaleArgs.zeroBottom

  const accessor = args[namespaceAccessorName]

  // add together all relevant data arrays.
  let allData = args.data.flat()
    .map(function (dp) {
      return dp[accessor]
    })
    .concat(additionalDataArrays.flat())

  // do processing for log
  if (args[namespace + 'ScaleType'] === 'log') {
    allData = allData.filter(function (d) {
      return d > 0
    })
  }

  // use inflator?
  const extents = extent(allData)
  let minVal = extents[0]
  let maxVal = extents[1]

  // bolt scale domain to zero when the right conditions are met:
  // not pulling the bottom of the range from data
  // not zero-bottomed
  // not a time series
  if (zeroBottom && !args['min_' + namespace + '_from_data'] && minVal > 0 && !scaleArgs.isTimeSeries) {
    minVal = args[namespace + 'ScaleType'] === 'log' ? 1 : 0
  }

  if (args[namespace + 'ScaleType'] !== 'log' && minVal < 0 && !scaleArgs.isTimeSeries) {
    minVal = minVal - (minVal - minVal * args.inflator) * useInflator
  }

  if (!scaleArgs.isTimeSeries) {
    maxVal = (maxVal < 0) ? maxVal + (maxVal - maxVal * args.inflator) * useInflator : maxVal * (useInflator ? args.inflator : 1)
  }

  minVal = args['min_' + namespace] != null ? args['min_' + namespace] : minVal
  maxVal = args['max_' + namespace] != null ? args['max_' + namespace] : maxVal
  // if there's a single data point, we should custom-set the max values
  // so we're displaying some kind of range
  if (minVal === maxVal && args['min_' + namespace] == null &&
      args['max_' + namespace] == null) {
    if (minVal instanceof Date) {
      maxVal = new Date(clone(minVal).setDate(minVal.getDate() + 1))
    } else if (typeof minVal === 'number') {
      maxVal = minVal + 1
      forceXaxCountToBeTwo(args)
    }
  }

  args.processed['min_' + namespace] = minVal
  args.processed['max_' + namespace] = maxVal
  if (args.processed['zoom_' + namespace]) {
    args.processed['min_' + namespace] = args.processed['zoom_' + namespace][0]
    args.processed['max_' + namespace] = args.processed['zoom_' + namespace][1]
  }
  callHook('xAxis.processMinMax', args, args.processed.minX, args.processed.maxX)
  callHook('yAxis.processMinMax', args, args.processed.minY, args.processed.maxY)
}

export function categoricalGroupColorScale (args) {
  if (args.colorAccessor !== false) {
    if (args.yGroupAccessor) {
      // add a custom accessor element.
      if (args.colorAccessor === null) {
        args.colorAccessor = args.yAccessor
      } else {}
    }
    if (args.colorAccessor !== null) {
      new MGScale(args)
        .namespace('color')
        .categoricalDomainFromData()
        .categoricalColorRange()
    }
  }
}

export function addColorCategoricalScale (args, domain, accessor) {
  args.scales.color = scaleOrdinal(schemeCategory10).domain(domain)
  args.scaleFunctions.color = function (d) {
    return args.scales.color(d[accessor])
  }
}

export function getCategoricalDomain (data, accessor) {
  return Array.from(new Set(data.map(function (d) {
    return d[accessor]
  })))
}

export function getColorDomain (args) {
  let colorDomain
  if (args.colorDomain === null) {
    if (args.colorType === 'number') {
      colorDomain = extent(args.data[0], function (d) {
        return d[args.colorAccessor]
      })
    } else if (args.colorType === 'category') {
      colorDomain = getCategoricalDomain(args.data[0], args.colorAccessor)
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
