import { extent } from 'd3-array'
import { scaleOrdinal, scaleUtc, scaleTime, scaleLog, scaleLinear, scaleBand } from 'd3-scale'
import { schemeCategory20, schemeCategory10 } from 'd3-scale-chromatic'
import { getPlotRight, getPlotLeft, getPlotBottom, getPlotTop, clone } from '../misc/utility'
import { forceXaxCountToBeTwo } from './xAxis'

export function addScaleFunction (args, scaleFunctionName, scale, accessor, inflation) {
  args.scaleFunctions[scaleFunctionName] = function (di) {
    if (inflation === undefined) return args.scales[scale](di[accessor])
    else return args.scales[scale](di[accessor]) + inflation
  }
}

export function mg_position (str, args) {
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

export function MGScale (args) {
  // big wrapper around d3 scale that automatically formats & calculates scale bounds
  // according to the data, and handles other niceties.
  var scaleArgs = {}
  scaleArgs.useInflator = false
  scaleArgs.zeroBottom = false
  scaleArgs.scaleType = 'numerical'

  this.namespace = function (_namespace) {
    scaleArgs.namespace = _namespace
    scaleArgs.namespaceAccessorName = scaleArgs.namespace + '_accessor'
    scaleArgs.scale_name = scaleArgs.namespace.toUpperCase()
    scaleArgs.scalefn_name = scaleArgs.namespace + 'f'
    return this
  }

  this.scaleName = function (scaleName) {
    scaleArgs.scale_name = scaleName.toUpperCase()
    scaleArgs.scalefn_name = scaleName + 'f'
    return this
  }

  this.inflateDomain = function (tf) {
    scaleArgs.useInflator = tf
    return this
  }

  this.zeroBottom = function (tf) {
    scaleArgs.zeroBottom = tf
    return this
  }

  /// //////////////////////////////////////////////////////////////////////////////////////////////////////
  /// all scale domains are either numerical (number, date, etc.) or categorical (factor, label, etc) /////
  /// //////////////////////////////////////////////////////////////////////////////////////////////////////
  // these functions automatically create the d3 scale function and place the domain.

  this.numericalDomainFromData = function () {
    var otherFlatDataArrays = []

    if (arguments.length > 0) {
      otherFlatDataArrays = arguments
    }

    // pull out a non-empty array in args.data.
    var illustrativeData
    for (var i = 0; i < args.data.length; i++) {
      if (args.data[i].length > 0) {
        illustrativeData = args.data[i]
      }
    }
    scaleArgs.is_timeSeries = !!(illustrativeData[0][args[scaleArgs.namespaceAccessorName]] instanceof Date)

    addScaleFunction(args, scaleArgs.scalefn_name, scaleArgs.scale_name, args[scaleArgs.namespaceAccessorName])

    minMaxNumerical(args, scaleArgs, otherFlatDataArrays, scaleArgs.useInflator)

    var timeScale = args.utcTime ? scaleUtc() : scaleTime()

    args.scales[scaleArgs.scale_name] = (scaleArgs.is_timeSeries)
      ? timeScale
      : (typeof args[scaleArgs.namespace + 'ScaleType'] === 'function')
        ? args.yScaleType()
        : (args[scaleArgs.namespace + 'ScaleType'] === 'log')
          ? scaleLog()
          : scaleLinear()

    args.scales[scaleArgs.scale_name].domain([args.processed['min_' + scaleArgs.namespace], args.processed['max_' + scaleArgs.namespace]])
    scaleArgs.scaleType = 'numerical'

    return this
  }

  this.categoricalDomain = function (domain) {
    args.scales[scaleArgs.scale_name] = scaleOrdinal().domain(domain)
    addScaleFunction(args, scaleArgs.scalefn_name, scaleArgs.scale_name, args[scaleArgs.namespaceAccessorName])
    return this
  }

  this.categoricalDomainFromData = function () {
    // make args.categoricalVariables.
    // lets make the categorical variables.
    var allData = args.data.flat()
    // d3.set(data.map(function(d){return d[args.group_accessor]})).values()
    scaleArgs.categoricalVariables = Array.from(new Set(allData.map(function (d) {
      return d[args[scaleArgs.namespaceAccessorName]]
    })))
    args.scales[scaleArgs.scale_name] = scaleBand()
      .domain(scaleArgs.categoricalVariables)

    scaleArgs.scaleType = 'categorical'
    return this
  }

  /// //////////////////////////////////////////////////////////////////////////////////////////////////////////
  /// /////// all scale ranges are either positional (for axes, etc) or arbitrary (colors, size, etc) //////////
  /// //////////////////////////////////////////////////////////////////////////////////////////////////////////

  this.numericalRange = function (range) {
    if (typeof range === 'string') {
      args
        .scales[scaleArgs.scale_name]
        .range(mg_position(range, args))
    } else {
      args
        .scales[scaleArgs.scale_name]
        .range(range)
    }

    return this
  }

  this.categoricalRangeBands = function (range, halfway) {
    if (halfway === undefined) halfway = false

    var namespace = scaleArgs.namespace
    var paddingPercentage = args[namespace + '_padding_percentage']
    var outerPaddingPercentage = args[namespace + '_outer_padding_percentage']
    if (typeof range === 'string') {
      // if string, it's a location. Place it accordingly.
      args.scales[scaleArgs.scale_name]
        .range(mg_position(range, args))
        .paddingInner(paddingPercentage)
        .paddingOuter(outerPaddingPercentage)
    } else {
      args.scales[scaleArgs.scale_name]
        .range(range)
        .paddingInner(paddingPercentage)
        .paddingOuter(outerPaddingPercentage)
    }

    addScaleFunction(
      args,
      scaleArgs.scalefn_name,
      scaleArgs.scale_name,
      args[scaleArgs.namespaceAccessorName],
      halfway
        ? args.scales[scaleArgs.scale_name].bandwidth() / 2
        : 0
    )

    return this
  }

  this.categoricalRange = function (range) {
    args.scales[scaleArgs.scale_name].range(range)
    addScaleFunction(args, scaleArgs.scalefn_name, scaleArgs.scale_name, args[scaleArgs.namespaceAccessorName])
    return this
  }

  this.categoricalColorRange = function () {
    args.scales[scaleArgs.scale_name] = args.scales[scaleArgs.scale_name].domain().length > 10
      ? scaleOrdinal(schemeCategory20)
      : scaleOrdinal(schemeCategory10)

    args
      .scales[scaleArgs.scale_name]
      .domain(scaleArgs.categoricalVariables)

    addScaleFunction(args, scaleArgs.scalefn_name, scaleArgs.scale_name, args[scaleArgs.namespaceAccessorName])
    return this
  }

  this.clamp = function (yn) {
    args.scales[scaleArgs.scale_name].clamp(yn)
    return this
  }

  return this
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
  var namespace = scaleArgs.namespace
  var namespaceAccessorName = scaleArgs.namespaceAccessorName
  var useInflator = scaleArgs.useInflator
  var zeroBottom = scaleArgs.zeroBottom

  var accessor = args[namespaceAccessorName]

  // add together all relevant data arrays.
  var allData = args.data.flat()
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
  var extents = extent(allData)
  var minVal = extents[0]
  var maxVal = extents[1]

  // bolt scale domain to zero when the right conditions are met:
  // not pulling the bottom of the range from data
  // not zero-bottomed
  // not a time series
  if (zeroBottom && !args['min_' + namespace + '_from_data'] && minVal > 0 && !scaleArgs.is_timeSeries) {
    minVal = args[namespace + 'ScaleType'] === 'log' ? 1 : 0
  }

  if (args[namespace + 'ScaleType'] !== 'log' && minVal < 0 && !scaleArgs.is_timeSeries) {
    minVal = minVal - (minVal - minVal * args.inflator) * useInflator
  }

  if (!scaleArgs.is_timeSeries) {
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
  args.scales.color = scaleOrdinal(schemeCategory20).domain(domain)
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
  var colorDomain
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
  var colorRange
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
