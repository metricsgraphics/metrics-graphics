import { addG, getRight, getBottom, getPlotLeft, getPlotRight, getSvgChildOf, normalize, selectAllAndRemove, getPlotTop, getPlotBottom, addColorAccessorToRug, makeRug, exitAndRemove, elementsAreOverlapping } from '../misc/utility'
import { select } from 'd3-selection'
import { scaleLinear, scaleLog } from 'd3-scale'
import { format } from 'd3-format'
import { max } from 'd3-array'
import { timeFormat as d3TimeFormat } from 'd3-time-format'
import { defaultXaxFormat, getYFormatAndSecondaryTimeFunction } from './x_axis'

export function processScaleTicks (args, axis) {
  var accessor = args[axis + 'Accessor']
  var scaleTicks = args.scales[axis.toUpperCase()].ticks(args[axis + 'axCount'])
  var max = args.processed[axis + 'Max']

  function log10 (val) {
    if (val === 1000) {
      return 3
    }
    if (val === 1000000) {
      return 7
    }
    return Math.log(val) / Math.LN10
  }

  if (args[axis + 'ScaleType'] === 'log') {
    // get out only whole logs
    scaleTicks = scaleTicks.filter(function (d) {
      return Math.abs(log10(d)) % 1 < 1e-6 || Math.abs(log10(d)) % 1 > 1 - 1e-6
    })
  }

  // filter out fraction ticks if our data is ints and if xmax > number of generated ticks
  var numberOfTicks = scaleTicks.length

  // is our data object all ints?
  var dataIsInt = true
  args.data.forEach(function (d, i) {
    d.forEach(function (d, i) {
      if (d[accessor] % 1 !== 0) {
        dataIsInt = false
        return false
      }
    })
  })

  if (dataIsInt && numberOfTicks > max && args.format === 'count') {
    // remove non-integer ticks
    scaleTicks = scaleTicks.filter(function (d) {
      return d % 1 === 0
    })
  }

  args.processed[axis + 'Ticks'] = scaleTicks
}

export function rugPlacement (args, axisArgs) {
  var position = axisArgs.position
  var ns = axisArgs.namespace
  var coordinates = {}
  if (position === 'left') {
    coordinates.x1 = args.left + 1
    coordinates.x2 = args.left + args.rugBufferSize
    coordinates.y1 = args.scaleFunctions[ns + 'f']
    coordinates.y2 = args.scaleFunctions[ns + 'f']
  }
  if (position === 'right') {
    coordinates.x1 = getRight(args) - 1
    coordinates.x2 = getRight(args) - args.rugBufferSize
    coordinates.y1 = args.scaleFunctions[ns + 'f']
    coordinates.y2 = args.scaleFunctions[ns + 'f']
  }
  if (position === 'top') {
    coordinates.x1 = args.scaleFunctions[ns + 'f']
    coordinates.x2 = args.scaleFunctions[ns + 'f']
    coordinates.y1 = args.top + 1
    coordinates.y2 = args.top + args.rugBufferSize
  }
  if (position === 'bottom') {
    coordinates.x1 = args.scaleFunctions[ns + 'f']
    coordinates.x2 = args.scaleFunctions[ns + 'f']
    coordinates.y1 = getBottom(args) - 1
    coordinates.y2 = getBottom(args) - args.rugBufferSize
  }
  return coordinates
}

export function rimPlacement (args, axisArgs) {
  var ns = axisArgs.namespace
  var position = axisArgs.position
  var tickLength = args.processed[ns + 'Ticks'].length
  var ticks = args.processed[ns + 'Ticks']
  var scale = args.scales[ns.toUpperCase()]
  var coordinates = {}

  if (position === 'left') {
    coordinates.x1 = args.left
    coordinates.x2 = args.left
    coordinates.y1 = tickLength ? scale(ticks[0]).toFixed(2) : args.top
    coordinates.y2 = tickLength ? scale(ticks[tickLength - 1]).toFixed(2) : getBottom(args)
  }
  if (position === 'right') {
    coordinates.x1 = getRight(args)
    coordinates.x2 = getRight(args)
    coordinates.y1 = tickLength ? scale(ticks[0]).toFixed(2) : args.top
    coordinates.y2 = tickLength ? scale(ticks[tickLength - 1]).toFixed(2) : getBottom(args)
  }
  if (position === 'top') {
    coordinates.x1 = args.left
    coordinates.x2 = getRight(args)
    coordinates.y1 = args.top
    coordinates.y2 = args.top
  }
  if (position === 'bottom') {
    coordinates.x1 = args.left
    coordinates.x2 = getRight(args)
    coordinates.y1 = getBottom(args)
    coordinates.y2 = getBottom(args)
  }

  if (position === 'left' || position === 'right') {
    if (args.axesNotCompact) {
      coordinates.y1 = getBottom(args)
      coordinates.y2 = args.top
    } else if (tickLength) {
      coordinates.y1 = scale(ticks[0]).toFixed(2)
      coordinates.y2 = scale(ticks[tickLength - 1]).toFixed(2)
    }
  }

  return coordinates
}

export function labelPlacement (args, axisArgs) {
  var position = axisArgs.position
  var ns = axisArgs.namespace
  var tickLength = args[ns + 'axTickLength']
  var scale = args.scales[ns.toUpperCase()]
  var coordinates = {}

  if (position === 'left') {
    coordinates.x = args.left - tickLength * 3 / 2
    coordinates.y = function (d) {
      return scale(d).toFixed(2)
    }
    coordinates.dx = -3
    coordinates.dy = '.35em'
    coordinates.textAnchor = 'end'
    coordinates.text = function (d) {
      return computeYaxFormat(args)(d)
    }
  }
  if (position === 'right') {
    coordinates.x = getRight(args) + tickLength * 3 / 2
    coordinates.y = function (d) {
      return scale(d).toFixed(2)
    }
    coordinates.dx = 3
    coordinates.dy = '.35em'
    coordinates.textAnchor = 'start'
    coordinates.text = function (d) {
      return computeYaxFormat(args)(d)
    }
  }
  if (position === 'top') {
    coordinates.x = function (d) {
      return scale(d).toFixed(2)
    }
    coordinates.y = (args.top - tickLength * 7 / 3).toFixed(2)
    coordinates.dx = 0
    coordinates.dy = '0em'
    coordinates.textAnchor = 'middle'
    coordinates.text = function (d) {
      return defaultXaxFormat(args)(d)
    }
  }
  if (position === 'bottom') {
    coordinates.x = function (d) {
      return scale(d).toFixed(2)
    }
    coordinates.y = (getBottom(args) + tickLength * 7 / 3).toFixed(2)
    coordinates.dx = 0
    coordinates.dy = '.50em'
    coordinates.textAnchor = 'middle'
    coordinates.text = function (d) {
      return defaultXaxFormat(args)(d)
    }
  }

  return coordinates
}

export function addSecondaryLabelElements (args, axisArgs, g) {
  var tf = getYFormatAndSecondaryTimeFunction(args)
  var years = tf.secondary(args.processed.minX, args.processed.maxX)
  if (years.length === 0) {
    var firstTick = args.scales.X.ticks(args.xaxCount)[0]
    years = [firstTick]
  }

  var yg = addG(g, 'mg-year-marker')
  if (tf.timeframe === 'default' && args.showYearMarkers) {
    yearMarkerLine(args, axisArgs, yg, years, tf.yFormat)
  }
  if (tf.tickDiffTimeframe !== 'years') yearMarkerText(args, axisArgs, yg, years, tf.yFormat)
}

export function yearMarkerLine (args, axisArgs, g, years, yFormat) {
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
    .attr('y2', getBottom(args))
}

export function yearMarkerText (args, axisArgs, g, years, yFormat) {
  var position = axisArgs.position
  var ns = axisArgs.namespace
  var scale = args.scales[ns.toUpperCase()]
  var x, y, dy, textAnchor, textFcn
  var xAxisTextElement = select(args.target)
    .select('.mg-x-axis text').node().getBoundingClientRect()

  if (position === 'top') {
    x = function (d, i) {
      return scale(d).toFixed(2)
    }
    y = (args.top - args.xaxTickLength * 7 / 3) - (xAxisTextElement.height)
    dy = '.50em'
    textAnchor = 'middle'
    textFcn = function (d) {
      return yFormat(new Date(d))
    }
  }
  if (position === 'bottom') {
    x = function (d, i) {
      return scale(d).toFixed(2)
    }
    y = (getBottom(args) + args.xaxTickLength * 7 / 3) + (xAxisTextElement.height * 0.8)
    dy = '.50em'
    textAnchor = 'middle'
    textFcn = function (d) {
      return yFormat(new Date(d))
    }
  }

  g.selectAll('.mg-year-marker')
    .data(years).enter()
    .append('text')
    .attr('x', x)
    .attr('y', y)
    .attr('dy', dy)
    .attr('text-anchor', textAnchor)
    .text(textFcn)
}

export function addNumericalLabels (g, args, axisArgs) {
  var ns = axisArgs.namespace
  var coords = labelPlacement(args, axisArgs)
  var ticks = args.processed[ns + 'Ticks']

  var labels = g.selectAll('.mg-yax-labels')
    .data(ticks).enter()
    .append('text')
    .attr('x', coords.x)
    .attr('dx', coords.dx)
    .attr('y', coords.y)
    .attr('dy', coords.dy)
    .attr('text-anchor', coords.textAnchor)
    .text(coords.text)
  // move the labels if they overlap
  if (ns === 'x') {
    if (args.timeSeries && args.europeanClock) {
      labels.append('tspan').classed('mg-european-hours', true).text(function (_d, i) {
        var d = new Date(_d)
        if (i === 0) return d3TimeFormat('%H')(d)
        else return ''
      })
      labels.append('tspan').classed('mg-european-minutes-seconds', true).text(function (_d, i) {
        var d = new Date(_d)
        return ':' + args.processed.xaxFormat(d)
      })
    } else {
      labels.text(function (d) {
        return args.xaxUnits + args.processed.xaxFormat(d)
      })
    }

    if (args.timeSeries && (args.showYears || args.showSecondaryXLabel)) {
      addSecondaryLabelElements(args, axisArgs, g)
    }
  }

  if (elementsAreOverlapping(labels)) {
    labels.filter(function (d, i) {
      return (i + 1) % 2 === 0
    }).remove()

    var svg = getSvgChildOf(args.target)
    svg.selectAll('.mg-' + ns + 'ax-ticks').filter(function (d, i) {
      return (i + 1) % 2 === 0
    })
      .remove()
  }
}

export function addTickLines (g, args, axisArgs) {
  // name
  var ns = axisArgs.namespace
  var position = axisArgs.position
  var scale = args.scales[ns.toUpperCase()]

  var ticks = args.processed[ns + 'Ticks']
  var ticksClass = 'mg-' + ns + 'ax-ticks'
  var extendedTicksClass = 'mg-extended-' + ns + 'ax-ticks'
  var extendedTicks = args[ns + 'ExtendedTicks']
  var tickLength = args[ns + 'axTickLength']

  var x1, x2, y1, y2

  if (position === 'left') {
    x1 = args.left
    x2 = extendedTicks ? getRight(args) : args.left - tickLength
    y1 = function (d) {
      return scale(d).toFixed(2)
    }
    y2 = function (d) {
      return scale(d).toFixed(2)
    }
  }
  if (position === 'right') {
    x1 = getRight(args)
    x2 = extendedTicks ? args.left : getRight(args) + tickLength
    y1 = function (d) {
      return scale(d).toFixed(2)
    }
    y2 = function (d) {
      return scale(d).toFixed(2)
    }
  }
  if (position === 'top') {
    x1 = function (d) {
      return scale(d).toFixed(2)
    }
    x2 = function (d) {
      return scale(d).toFixed(2)
    }
    y1 = args.top
    y2 = extendedTicks ? getBottom(args) : args.top - tickLength
  }
  if (position === 'bottom') {
    x1 = function (d) {
      return scale(d).toFixed(2)
    }
    x2 = function (d) {
      return scale(d).toFixed(2)
    }
    y1 = getBottom(args)
    y2 = extendedTicks ? args.top : getBottom(args) + tickLength
  }

  g.selectAll('.' + ticksClass)
    .data(ticks).enter()
    .append('line')
    .classed(extendedTicksClass, extendedTicks)
    .attr('x1', x1)
    .attr('x2', x2)
    .attr('y1', y1)
    .attr('y2', y2)
}

export function initializeAxisRim (g, args, axisArgs) {
  var namespace = axisArgs.namespace
  var tickLength = args.processed[namespace + 'Ticks'].length

  var rim = rimPlacement(args, axisArgs)

  if (!args[namespace + 'ExtendedTicks'] && !args[namespace + 'ExtendedTicks'] && tickLength) {
    g.append('line')
      .attr('x1', rim.x1)
      .attr('x2', rim.x2)
      .attr('y1', rim.y1)
      .attr('y2', rim.y2)
  }
}

export function initializeRug (args, rugClass) {
  var svg = getSvgChildOf(args.target)
  var allData = args.data.flat()
  var rug = svg.selectAll('line.' + rugClass).data(allData)

  // set the attributes that do not change after initialization, per
  rug.enter().append('svg:line').attr('class', rugClass).attr('opacity', 0.3)

  // remove rug elements that are no longer in use
  exitAndRemove(rug)

  return rug
}

export function rug (args, axisArgs) {
  'use strict'
  args.rugBufferSize = args.chartType === 'point' ? args.buffer / 2 : args.buffer * 2 / 3

  var rug = initializeRug(args, 'mg-' + axisArgs.namespace + '-rug')
  var rugPositions = rugPlacement(args, axisArgs)
  rug.attr('x1', rugPositions.x1)
    .attr('x2', rugPositions.x2)
    .attr('y1', rugPositions.y1)
    .attr('y2', rugPositions.y2)

  addColorAccessorToRug(rug, args, 'mg-' + axisArgs.namespace + '-rug-mono')
}

export function categoricalLabelPlacement (args, axisArgs, group) {
  var ns = axisArgs.namespace
  var position = axisArgs.position
  var scale = args.scales[ns.toUpperCase()]
  var groupScale = args.scales[(ns + 'group').toUpperCase()]
  var coords = {}
  coords.cat = {}
  coords.group = {}
  // x, y, dy, text-anchor

  if (position === 'left') {
    coords.cat.x = getPlotLeft(args) - args.buffer
    coords.cat.y = function (d) {
      return groupScale(group) + scale(d) + scale.bandwidth() / 2
    }
    coords.cat.dy = '.35em'
    coords.cat.textAnchor = 'end'
    coords.group.x = getPlotLeft(args) - args.buffer
    coords.group.y = groupScale(group) + (groupScale.bandwidth ? groupScale.bandwidth() / 2 : 0)
    coords.group.dy = '.35em'
    coords.group.textAnchor = args['rotate_' + ns + '_labels'] ? 'end' : 'end'
  }

  if (position === 'right') {
    coords.cat.x = getPlotRight(args) - args.buffer
    coords.cat.y = function (d) {
      return groupScale(group) + scale(d) + scale.bandwidth() / 2
    }
    coords.cat.dy = '.35em'
    coords.cat.textAnchor = 'start'
    coords.group.x = getPlotRight(args) - args.buffer
    coords.group.y = groupScale(group) + (groupScale.bandwidth ? groupScale.bandwidth() / 2 : 0)
    coords.group.dy = '.35em'
    coords.group.textAnchor = 'start'
  }

  if (position === 'top') {
    coords.cat.x = function (d) {
      return groupScale(group) + scale(d) + scale.bandwidth() / 2
    }
    coords.cat.y = getPlotTop(args) + args.buffer
    coords.cat.dy = '.35em'
    coords.cat.textAnchor = args['rotate_' + ns + '_labels'] ? 'start' : 'middle'
    coords.group.x = groupScale(group) + (groupScale.bandwidth ? groupScale.bandwidth() / 2 : 0)
    coords.group.y = getPlotTop(args) + args.buffer
    coords.group.dy = '.35em'
    coords.group.textAnchor = args['rotate_' + ns + '_labels'] ? 'start' : 'middle'
  }

  if (position === 'bottom') {
    coords.cat.x = function (d) {
      return groupScale(group) + scale(d) + scale.bandwidth() / 2
    }
    coords.cat.y = getPlotBottom(args) + args.buffer
    coords.cat.dy = '.35em'
    coords.cat.textAnchor = args['rotate_' + ns + '_labels'] ? 'start' : 'middle'
    coords.group.x = groupScale(group) + (groupScale.bandwidth ? groupScale.bandwidth() / 2 - scale.bandwidth() / 2 : 0)
    coords.group.y = getPlotBottom(args) + args.buffer
    coords.group.dy = '.35em'
    coords.group.textAnchor = args['rotate_' + ns + '_labels'] ? 'start' : 'middle'
  }

  return coords
}

export function categoricalLabels (args, axisArgs) {
  var ns = axisArgs.namespace
  var nsClass = 'mg-' + ns + '-axis'
  var scale = args.scales[ns.toUpperCase()]
  var groupScale = args.scales[(ns + 'group').toUpperCase()]
  var groupAccessor = ns + 'group_accessor'

  var svg = getSvgChildOf(args.target)
  selectAllAndRemove(svg, '.' + nsClass)
  var g = addG(svg, nsClass)
  var groupG
  var groups = groupScale.domain && groupScale.domain()
    ? groupScale.domain()
    : ['1']

  groups.forEach(function (group) {
    // grab group placement stuff.
    var coords = categoricalLabelPlacement(args, axisArgs, group)

    var labels
    groupG = addG(g, 'mg-group-' + normalize(group))
    if (args[groupAccessor] !== null) {
      labels = groupG.append('text')
        .classed('mg-barplot-group-label', true)
        .attr('x', coords.group.x)
        .attr('y', coords.group.y)
        .attr('dy', coords.group.dy)
        .attr('text-anchor', coords.group.textAnchor)
        .text(group)
    } else {
      labels = groupG.selectAll('text')
        .data(scale.domain())
        .enter()
        .append('text')
        .attr('x', coords.cat.x)
        .attr('y', coords.cat.y)
        .attr('dy', coords.cat.dy)
        .attr('text-anchor', coords.cat.textAnchor)
        .text(String)
    }
    if (args['rotate_' + ns + '_labels']) {
      rotateLabels(labels, args['rotate_' + ns + '_labels'])
    }
  })
}

export function categoricalGuides (args, axisArgs) {
  // for each group
  // for each data point

  var ns = axisArgs.namespace
  var groupScale = args.scales[(ns + 'group').toUpperCase()]
  var scale = args.scales[ns.toUpperCase()]
  var position = axisArgs.position

  var svg = getSvgChildOf(args.target)

  var x1, x2, y1, y2
  var grs = (groupScale.domain && groupScale.domain()) ? groupScale.domain() : [null]

  selectAllAndRemove(svg, '.mg-category-guides')
  var g = addG(svg, 'mg-category-guides')

  grs.forEach(function (group) {
    scale.domain().forEach(function (cat) {
      if (position === 'left' || position === 'right') {
        x1 = getPlotLeft(args)
        x2 = getPlotRight(args)
        y1 = scale(cat) + groupScale(group) + scale.bandwidth() / 2
        y2 = scale(cat) + groupScale(group) + scale.bandwidth() / 2
      }

      if (position === 'top' || position === 'bottom') {
        x1 = scale(cat) + groupScale(group) + scale.bandwidth() / 2 * (group === null)
        x2 = scale(cat) + groupScale(group) + scale.bandwidth() / 2 * (group === null)
        y1 = getPlotBottom(args)
        y2 = getPlotTop(args)
      }

      g.append('line')
        .attr('x1', x1)
        .attr('x2', x2)
        .attr('y1', y1)
        .attr('y2', y2)
        .attr('stroke-dasharray', '2,1')
    })

    var first = groupScale(group) + scale(scale.domain()[0]) + scale.bandwidth() / 2 * (group === null || (position !== 'top' && position !== 'bottom'))
    var last = groupScale(group) + scale(scale.domain()[scale.domain().length - 1]) + scale.bandwidth() / 2 * (group === null || (position !== 'top' && position !== 'bottom'))

    var x11, x21, y11, y21, x12, x22, y12, y22
    if (position === 'left' || position === 'right') {
      x11 = getPlotLeft(args)
      x21 = getPlotLeft(args)
      y11 = first
      y21 = last

      x12 = getPlotRight(args)
      x22 = getPlotRight(args)
      y12 = first
      y22 = last
    }

    if (position === 'bottom' || position === 'top') {
      x11 = first
      x21 = last
      y11 = getPlotBottom(args)
      y21 = getPlotBottom(args)

      x12 = first
      x22 = last
      y12 = getPlotTop(args)
      y22 = getPlotTop(args)
    }

    g.append('line')
      .attr('x1', x11)
      .attr('x2', x21)
      .attr('y1', y11)
      .attr('y2', y21)
      .attr('stroke-dasharray', '2,1')

    g.append('line')
      .attr('x1', x12)
      .attr('x2', x22)
      .attr('y1', y12)
      .attr('y2', y22)
      .attr('stroke-dasharray', '2,1')
  })
}

export function rotateLabels (labels, rotationDegree) {
  if (rotationDegree) {
    labels.attr('transform', function () {
      var elem = select(this)
      return 'rotate(' + rotationDegree + ' ' + elem.attr('x') + ',' + elem.attr('y') + ')'
    })
  }
}

export function zeroLine (args, axisArgs) {
  var svg = getSvgChildOf(args.target)
  var ns = axisArgs.namespace
  var position = axisArgs.position
  var scale = args.scales[ns.toUpperCase()]
  var x1, x2, y1, y2
  if (position === 'left' || position === 'right') {
    x1 = getPlotLeft(args)
    x2 = getPlotRight(args)
    y1 = scale(0) + 1
    y2 = scale(0) + 1
  }
  if (position === 'bottom' || position === 'top') {
    y1 = getPlotTop(args)
    y2 = getPlotBottom(args)
    x1 = scale(0) - 1
    x2 = scale(0) - 1
  }

  svg.append('line')
    .attr('x1', x1)
    .attr('x2', x2)
    .attr('y1', y1)
    .attr('y2', y2)
    .attr('stroke', 'black')
}

var mgDrawAxis = {}

mgDrawAxis.categorical = function (args, axisArgs) {
  categoricalLabels(args, axisArgs)
  categoricalGuides(args, axisArgs)
}

mgDrawAxis.numerical = function (args, axisArgs) {
  var namespace = axisArgs.namespace
  var axisName = namespace + '_axis'
  var axisClass = 'mg-' + namespace + '-axis'
  var svg = getSvgChildOf(args.target)

  selectAllAndRemove(svg, '.' + axisClass)

  if (!args[axisName]) {
    return this
  }

  var g = addG(svg, axisClass)

  processScaleTicks(args, namespace)
  initializeAxisRim(g, args, axisArgs)
  addTickLines(g, args, axisArgs)
  addNumericalLabels(g, args, axisArgs)

  // add label
  if (args[namespace + '_label']) {
    axisArgs.label(svg.select('.mg-' + namespace + '-axis'), args)
  }

  // add rugs
  if (args[namespace + '_rug']) {
    rug(args, axisArgs)
  }

  if (args.showBarZero) {
    barAddZeroLine(args)
  }

  return this
}

export function axisFactory (args) {
  var axisArgs = {}
  axisArgs.type = 'numerical'

  this.namespace = function (ns) {
    // take the ns in the scale, and use it to
    axisArgs.namespace = ns
    return this
  }

  this.rug = function (tf) {
    axisArgs.rug = tf
    return this
  }

  this.label = function (tf) {
    axisArgs.label = tf
    return this
  }

  this.type = function (t) {
    axisArgs.type = t
    return this
  }

  this.position = function (pos) {
    axisArgs.position = pos
    return this
  }

  this.zeroLine = function (tf) {
    axisArgs.zeroLine = tf
    return this
  }

  this.draw = function () {
    mgDrawAxis[axisArgs.type](args, axisArgs)
    return this
  }

  return this
}

export function yRug (args) {
  'use strict'

  if (!args.yRug) {
    return
  }

  args.rugBufferSize = args.chartType === 'point'
    ? args.buffer / 2
    : args.buffer * 2 / 3

  var rug = makeRug(args, 'mg-y-rug')

  rug.attr('x1', args.left + 1)
    .attr('x2', args.left + args.rugBufferSize)
    .attr('y1', args.scaleFunctions.yf)
    .attr('y2', args.scaleFunctions.yf)

  addColorAccessorToRug(rug, args, 'mg-y-rug-mono')
}

export function changeYExtentsForBars (args, my) {
  if (args.chartType === 'bar') {
    my.min = 0
    my.max = max(args.data[0], function (d) {
      var trio = []
      trio.push(d[args.yAccessor])

      if (args.baselineAccessor !== null) {
        trio.push(d[args.baselineAccessor])
      }

      if (args.predictorAccessor !== null) {
        trio.push(d[args.predictorAccessor])
      }

      return Math.max.apply(null, trio)
    })
  }
  return my
}

export function computeYaxFormat (args) {
  var yaxFormat = args.yaxFormat
  if (!yaxFormat) {
    let decimals = args.decimals
    if (args.format === 'count') {
      // increase decimals if we have small values, useful for realtime data
      if (args.processed.yTicks.length > 1) {
        // calculate the number of decimals between the difference of ticks
        // based on approach in flot: https://github.com/flot/flot/blob/958e5fd43c6dff4bab3e1fd5cb6109df5c1e8003/jquery.flot.js#L1810
        decimals = Math.max(0, -Math.floor(
          Math.log(Math.abs(args.processed.yTicks[1] - args.processed.yTicks[0])) / Math.LN10
        ))
      }

      yaxFormat = function (d) {
        var pf

        if (decimals !== 0) {
          // don't scale tiny values
          pf = format(',.' + decimals + 'f')
        } else if (d < 1000) {
          pf = format(',.0f')
        } else {
          pf = format(',.2s')
        }

        // are we adding units after the value or before?
        if (args.yaxUnitsAppend) {
          return pf(d) + args.yaxUnits
        } else {
          return args.yaxUnits + pf(d)
        }
      }
    } else { // percentage
      yaxFormat = function (d_) {
        var n = format('.0%')
        return n(d_)
      }
    }
  }
  return yaxFormat
}

export function barAddZeroLine (args) {
  var svg = getSvgChildOf(args.target)
  var extents = args.scales.X.domain()
  if (extents[0] <= 0 && extents[1] >= 0) {
    var r = args.scales.Y.range()
    var g = args.categoricalGroups.length
      ? args.scales.YGROUP(args.categoricalGroups[args.categoricalGroups.length - 1])
      : args.scales.YGROUP()

    svg.append('svg:line')
      .attr('x1', args.scales.X(0))
      .attr('x2', args.scales.X(0))
      .attr('y1', r[0] + getPlotTop(args))
      .attr('y2', r[r.length - 1] + g)
      .attr('stroke', 'black')
      .attr('opacity', 0.2)
  }
}

export function yDomainRange (args, scale) {
  scale.domain([args.processed.minY, args.processed.maxY])
    .range([getPlotBottom(args), args.top])
  return scale
}

export function defineYScales (args) {
  var scale = (typeof args.yScaleType === 'function')
    ? args.yScaleType()
    : (args.yScaleType === 'log')
      ? scaleLog()
      : scaleLinear()

  if (args.yScaleType === 'log') {
    if (args.chartType === 'histogram') {
      // log histogram plots should start just below 1
      // so that bins with single counts are visible
      args.processed.minY = 0.2
    } else {
      if (args.processed.minY <= 0) {
        args.processed.minY = 1
      }
    }
  }
  args.scales.Y = yDomainRange(args, scale)
  args.scales.Y.clamp(args.yScaleType === 'log')

  // used for ticks and such, and designed to be paired with log or linear
  args.scales.yAxis = yDomainRange(args, scaleLinear())
}

export function addYLabel (g, args) {
  if (args.yLabel) {
    g.append('text')
      .attr('class', 'label')
      .attr('x', function () {
        return -1 * (getPlotTop(args) +
        ((getPlotBottom(args)) - (getPlotTop(args))) / 2)
      })
      .attr('y', function () {
        return args.left / 2
      })
      .attr('dy', '-1.2em')
      .attr('text-anchor', 'middle')
      .text(function (d) {
        return args.yLabel
      })
      .attr('transform', function (d) {
        return 'rotate(-90)'
      })
  }
}

export function addYAxisRim (g, args) {
  var tickLength = args.processed.yTicks.length
  if (!args.xExtendedTicks && !args.yExtendedTicks && tickLength) {
    var y1scale, y2scale

    if (args.axesNotCompact && args.chartType !== 'bar') {
      y1scale = args.height - args.bottom
      y2scale = args.top
    } else if (tickLength) {
      y1scale = args.scales.Y(args.processed.yTicks[0]).toFixed(2)
      y2scale = args.scales.Y(args.processed.yTicks[tickLength - 1]).toFixed(2)
    } else {
      y1scale = 0
      y2scale = 0
    }

    g.append('line')
      .attr('x1', args.left)
      .attr('x2', args.left)
      .attr('y1', y1scale)
      .attr('y2', y2scale)
  }
}

export function addYAxisTickLines (g, args) {
  g.selectAll('.mg-yax-ticks')
    .data(args.processed.yTicks).enter()
    .append('line')
    .classed('mg-extended-yax-ticks', args.yExtendedTicks)
    .attr('x1', args.left)
    .attr('x2', function () {
      return (args.yExtendedTicks) ? args.width - args.right : args.left - args.yaxTickLength
    })
    .attr('y1', function (d) {
      return args.scales.Y(d).toFixed(2)
    })
    .attr('y2', function (d) {
      return args.scales.Y(d).toFixed(2)
    })
}

export function addYAxisTickLabels (g, args) {
  var yaxFormat = computeYaxFormat(args)
  g.selectAll('.mg-yax-labels')
    .data(args.processed.yTicks).enter()
    .append('text')
    .attr('x', args.left - args.yaxTickLength * 3 / 2)
    .attr('dx', -3)
    .attr('y', function (d) {
      return args.scales.Y(d).toFixed(2)
    })
    .attr('dy', '.35em')
    .attr('text-anchor', 'end')
    .text(function (d) {
      var o = yaxFormat(d)
      return o
    })
}

// TODO ought to be deprecated, only used by histogram
export function yAxis (args) {
  if (!args.processed) {
    args.processed = {}
  }

  var svg = getSvgChildOf(args.target)
  callHook('yAxis.processMinMax', args, args.processed.minY, args.processed.maxY)
  selectAllAndRemove(svg, '.mg-y-axis')

  if (!args.yAxis) {
    return this
  }

  var g = addG(svg, 'mg-y-axis')
  addYLabel(g, args)
  processScaleTicks(args, 'y')
  addYAxisRim(g, args)
  addYAxisTickLines(g, args)
  addYAxisTickLabels(g, args)

  if (args.yRug) {
    yRug(args)
  }

  return this
}

export function addCategoricalLabels (args) {
  var svg = getSvgChildOf(args.target)
  selectAllAndRemove(svg, '.mg-y-axis')
  var g = addG(svg, 'mg-y-axis')
  var groupG; (args.categoricalGroups.length ? args.categoricalGroups : ['1']).forEach(function (group) {
    groupG = addG(g, 'mg-group-' + normalize(group))

    if (args.yGroupAccessor !== null) {
      addGroupLabel(groupG, group, args)
    } else {
      var labels = addGraphicLabels(groupG, group, args)
      rotateLabels(labels, args.rotateYLabels)
    }
  })
}

export function addGraphicLabels (g, group, args) {
  return g.selectAll('text').data(args.scales.Y.domain()).enter().append('svg:text')
    .attr('x', args.left - args.buffer)
    .attr('y', function (d) {
      return args.scales.YGROUP(group) + args.scales.Y(d) + args.scales.Y.bandwidth() / 2
    })
    .attr('dy', '.35em')
    .attr('text-anchor', 'end')
    .text(String)
}

export function addGroupLabel (g, group, args) {
  g.append('svg:text')
    .classed('mg-barplot-group-label', true)
    .attr('x', args.left - args.buffer)
    .attr('y', args.scales.YGROUP(group) + args.scales.YGROUP.bandwidth() / 2)
    .attr('dy', '.35em')
    .attr('text-anchor', 'end')
    .text(group)
}

export function drawGroupLines (args) {
  var svg = getSvgChildOf(args.target)
  var groups = args.scales.YGROUP.domain()

  svg.select('.mg-category-guides').selectAll('mg-group-lines')
    .data(groups)
    .enter().append('line')
    .attr('x1', getPlotLeft(args))
    .attr('x2', getPlotLeft(args))
    .attr('y1', function (d) {
      return args.scales.YGROUP(d)
    })
    .attr('y2', function (d) {
      return args.scales.YGROUP(d) + args.yGroupHeight
    })
    .attr('stroke-width', 1)
}

export function yCategoricalShowGuides (args) {
  // for each group
  // for each data point
  var svg = getSvgChildOf(args.target)
  var alreadyPlotted = []
  args.data[0].forEach(function (d) {
    if (alreadyPlotted.indexOf(d[args.yAccessor]) === -1) {
      svg.select('.mg-category-guides').append('line')
        .attr('x1', getPlotLeft(args))
        .attr('x2', getPlotRight(args))
        .attr('y1', args.scaleFunctions.yf(d) + args.scaleFunctions.yGroupFunction(d))
        .attr('y2', args.scaleFunctions.yf(d) + args.scaleFunctions.yGroupFunction(d))
        .attr('stroke-dasharray', '2,1')
    }
  })
}

export function yAxisCategorical (args) {
  if (!args.yAxis) {
    return this
  }

  addCategoricalLabels(args)
  if (args.showBarZero) barAddZeroLine(args)
  if (args.yGroupAccessor) drawGroupLines(args)
  if (args.yCategoricalShowGuides) yCategoricalShowGuides(args)
  return this
}
