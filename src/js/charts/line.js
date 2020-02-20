import { area, line } from 'd3-shape'
import { targetRef, preventVerticalOverlap, addG, selectAllAndRemove, timeFormat, getPlotLeft, getPlotRight, getSvgChildOf, dataInPlotBounds, clone } from '../misc/utility'
import { median, merge, group } from 'd3-array'
import { pathTween } from '../misc/transitions'
import { voronoi as d3voronoi } from 'd3-voronoi'
import { select, selectAll } from 'd3-selection'
import { callHook } from '../common/hooks'
import { globals } from '../common/dataGraphic'
import { init } from '../common/init'
import { MGScale } from '../common/scales'
import { axisFactory, yRug, addYLabel } from '../axis/yAxis'
import { xRug, addXLabel, getTimeFrame } from '../axis/xAxis'
import { addBrushFunction } from '../common/brush'
import { markers } from '../common/markers'
import { mouseoverText, clearMouseoverContainer } from '../common/rollover'
import { formatXAggregateMouseover, formatXMouseover, formatYMouseover } from '../misc/formatters'
import { windowListeners } from '../common/windowListeners'
import AbstractChart from './abstractChart'

function lineColorText (elem, lineId, { color, colors }) {
  elem.classed('mg-hover-line-color', color === null)
    .classed(`mg-hover-line${lineId}-color`, colors === null)
    .attr('fill', colors === null ? '' : colors[lineId - 1])
}

function lineGraphGenerators (args, plot, svg) {
  addLineGenerator(args, plot)
  addAreaGenerator(args, plot)
  addFlatLineGenerator(args, plot)
  addConfidenceBandGenerator(args, plot, svg)
}

function addConfidenceBandGenerator (args, plot, svg) {
  plot.existingBand = svg.selectAll('.mg-confidence-band').nodes()
  if (args.showConfidenceBand) {
    plot.confidence_area = area()
      .defined(plot.line.defined())
      .x(args.scaleFunctions.xf)
      .y0(d => {
        const l = args.showConfidenceBand[0]
        if (d[l] !== undefined) {
          return args.scales.Y(d[l])
        } else {
          return args.scales.Y(d[args.yAccessor])
        }
      })
      .y1(d => {
        const u = args.showConfidenceBand[1]
        if (d[u] !== undefined) {
          return args.scales.Y(d[u])
        } else {
          return args.scales.Y(d[args.yAccessor])
        }
      })
      .curve(args.interpolate)
  }
}

function addAreaGenerator ({ scaleFunctions, scales, interpolate, flipAreaUnderYValue }, plot) {
  const areaBaselineValue = (Number.isFinite(flipAreaUnderYValue)) ? scales.Y(flipAreaUnderYValue) : scales.Y.range()[0]

  plot.area = area()
    .defined(plot.line.defined())
    .x(scaleFunctions.xf)
    .y0(() => {
      return areaBaselineValue
    })
    .y1(scaleFunctions.yf)
    .curve(interpolate)
}

function addFlatLineGenerator ({ yAccessor, scaleFunctions, scales, interpolate }, plot) {
  plot.flat_line = line()
    .defined(d => (d._missing === undefined || d._missing !== true) && d[yAccessor] !== null)
    .x(scaleFunctions.xf)
    .y(() => scales.Y(plot.data_median))
    .curve(interpolate)
}

function addLineGenerator ({ scaleFunctions, interpolate, missingIsZero, yAccessor }, plot) {
  plot.line = line()
    .x(scaleFunctions.xf)
    .y(scaleFunctions.yf)
    .curve(interpolate)

  // if missingIsZero is not set, then hide data points that fall in missing
  // data ranges or that have been explicitly identified as missing in the
  // data source.
  if (!missingIsZero) {
    // a line is defined if the _missing attrib is not set to true
    // and the y-accessor is not null
    plot.line = plot.line.defined(d => (d._missing === undefined || d._missing !== true) && d[yAccessor] !== null)
  }
}

function addConfidenceBand (
  { showConfidenceBand, transitionOnUpdate, data, target },
  plot,
  svg,
  whichLine
) {
  if (showConfidenceBand) {
    if (svg.select(`.mg-confidence-band-${whichLine}`).empty()) {
      svg.append('path')
        .attr('class', `mg-confidence-band mg-confidence-band-${whichLine}`)
    }

    // transition this line's confidence band
    const confidenceBand = svg.select(`.mg-confidence-band-${whichLine}`)

    confidenceBand
      .transition()
      .duration(() => (transitionOnUpdate) ? 1000 : 0)
      .attr('d', plot.confidence_area(data[whichLine - 1]))
      .attr('clip-path', `url(#mg-plot-window-${targetRef(target)})`)
  }
}

function addArea ({ data, target, colors }, plot, svg, whichLine, lineId) {
  const areas = svg.selectAll(`.mg-main-area.mg-area${lineId}`)
  if (plot.display_area) {
    // if area already exists, transition it
    if (!areas.empty()) {
      svg.node().appendChild(areas.node())

      areas.transition()
        .duration(plot.update_transition_duration)
        .attr('d', plot.area(data[whichLine]))
        .attr('clip-path', `url(#mg-plot-window-${targetRef(target)})`)
    } else { // otherwise, add the area
      svg.append('path')
        .classed('mg-main-area', true)
        .classed(`mg-area${lineId}`, true)
        .classed('mg-area-color', colors === null)
        .classed(`mg-area${lineId}-color`, colors === null)
        .attr('d', plot.area(data[whichLine]))
        .attr('fill', colors === null ? '' : colors[lineId - 1])
        .attr('clip-path', `url(#mg-plot-window-${targetRef(target)})`)
    }
  } else if (!areas.empty()) {
    areas.remove()
  }
}

function defaultColorForPath (thisPath, lineId) {
  thisPath.classed('mg-line-color', true)
    .classed(`mg-line${lineId}-color`, true)
}

function colorLine ({ colors }, thisPath, whichLine, lineId) {
  if (colors) {
    // for now, if args.colors is not an array, then keep moving as if nothing happened.
    // if args.colors is not long enough, default to the usual lineId color.
    if (colors.constructor === Array) {
      thisPath.attr('stroke', colors[whichLine])
      if (colors.length < whichLine + 1) {
        // Go with default coloring.
        // thisPath.classed('mg-line' + (lineId) + '-color', true);
        defaultColorForPath(thisPath, lineId)
      }
    } else {
      // thisPath.classed('mg-line' + (lineId) + '-color', true);
      defaultColorForPath(thisPath, lineId)
    }
  } else {
    // this is the typical workflow
    // thisPath.classed('mg-line' + (lineId) + '-color', true);
    defaultColorForPath(thisPath, lineId)
  }
}

function addLineElement ({ animateOnLoad, data, yAccessor, target }, plot, thisPath, whichLine) {
  if (animateOnLoad) {
    plot.data_median = median(data[whichLine], d => d[yAccessor])
    thisPath.attr('d', plot.flat_line(data[whichLine]))
      .transition()
      .duration(1000)
      .attr('d', plot.line(data[whichLine]))
      .attr('clip-path', `url(#mg-plot-window-${targetRef(target)})`)
  } else { // or just add the line
    thisPath.attr('d', plot.line(data[whichLine]))
      .attr('clip-path', `url(#mg-plot-window-${targetRef(target)})`)
  }
}

function addLine (args, plot, svg, existingLine, whichLine, lineId) {
  if (!existingLine.empty()) {
    svg.node().appendChild(existingLine.node())

    const lineTransition = existingLine.transition()
      .duration(plot.update_transition_duration)

    if (!plot.display_area && args.transitionOnUpdate && !args.missingIsHidden) {
      lineTransition.attrTween('d', pathTween(plot.line(args.data[whichLine]), 4))
    } else {
      lineTransition.attr('d', plot.line(args.data[whichLine]))
    }
  } else { // otherwise...
    // if we're animating on load, animate the line from its median value
    const thisPath = svg.append('path')
      .attr('class', `mg-main-line mg-line${lineId}`)

    colorLine(args, thisPath, whichLine, lineId)
    addLineElement(args, plot, thisPath, whichLine)
  }
}

function addLegendElement (args, plot, whichLine, lineId) {
  let thisLegend
  if (args.legend) {
    if (Array.isArray(args.legend)) {
      thisLegend = args.legend[whichLine]
    } else if (typeof args.legend === 'function') {
      thisLegend = args.legend(args.data[whichLine])
    }

    if (args.legendTarget) {
      if (args.colors && args.colors.constructor === Array) {
        plot.legendText = `<span style='color:${args.colors[whichLine]}'>&mdash; ${thisLegend}&nbsp; </span>${plot.legendText}`
      } else {
        plot.legendText = `<span class='mg-line${lineId}-legend-color'>&mdash; ${thisLegend}&nbsp; </span>${plot.legendText}`
      }
    } else {
      let anchorPoint, anchorOrientation, dx

      if (args.yAxis_position === 'left') {
        anchorPoint = args.data[whichLine][args.data[whichLine].length - 1]
        anchorOrientation = 'start'
        dx = args.buffer
      } else {
        anchorPoint = args.data[whichLine][0]
        anchorOrientation = 'end'
        dx = -args.buffer
      }
      const legendText = plot.legend_group.append('svg:text')
        .attr('x', args.scaleFunctions.xf(anchorPoint))
        .attr('dx', dx)
        .attr('y', args.scaleFunctions.yf(anchorPoint))
        .attr('dy', '.35em')
        .attr('font-size', 10)
        .attr('text-anchor', anchorOrientation)
        .attr('font-weight', '300')
        .text(thisLegend)

      if (args.colors && args.colors.constructor === Array) {
        if (args.colors.length < whichLine + 1) {
          legendText.classed(`mg-line${lineId}-legend-color`, true)
        } else {
          legendText.attr('fill', args.colors[whichLine])
        }
      } else {
        legendText.classed('mg-line-legend-color', true)
          .classed(`mg-line${lineId}-legend-color`, true)
      }

      preventVerticalOverlap(plot.legend_group.selectAll('.mg-line-legend text').nodes(), args)
    }
  }
}

function plotLegendIfLegendTarget (target, legend) {
  if (target) select(target).html(legend)
}

function addLegendGroup ({ legend }, plot, svg) {
  if (legend) plot.legend_group = addG(svg, 'mg-line-legend')
}

function removeExistingLineRolloverElements (svg) {
  // remove the old rollovers if they already exist
  selectAllAndRemove(svg, '.mg-rollover-rect')
  selectAllAndRemove(svg, '.mg-voronoi')

  // remove the old rollover text and circle if they already exist
  selectAllAndRemove(svg, '.mg-active-datapoint')
  selectAllAndRemove(svg, '.mg-line-rollover-circle')
  // selectAllAndRemove(svg, '.mg-active-datapoint-container');
}

function addRolloverCircle ({ data, colors }, svg) {
  // append circle
  const circle = svg.selectAll('.mg-line-rollover-circle')
    .data(data)
    .enter().append('circle')
    .attr('cx', 0)
    .attr('cy', 0)
    .attr('r', 0)

  if (colors && colors.constructor === Array) {
    circle
      .attr('class', ({ __lineId__ }) => `mg-line${__lineId__}`)
      .attr('fill', (d, i) => colors[i])
      .attr('stroke', (d, i) => colors[i])
  } else {
    circle.attr('class', ({ __lineId__ }, i) => [
        `mg-line${__lineId__}`,
        `mg-line${__lineId__}-color`,
        `mg-area${__lineId__}-color`
    ].join(' '))
  }
  circle.classed('mg-line-rollover-circle', true)
}

function setUniqueLineIdForEachSeries ({ data, customLineColorMap }) {
  // update our data by setting a unique line id for each series
  // increment from 1... unless we have a custom increment series

  for (let i = 0; i < data.length; i++) {
    data[i].forEach(datum => {
      datum.__index__ = i + 1
      datum.__lineId__ = (customLineColorMap.length > 0) ? customLineColorMap[i] : i + 1
    })
  }
}

function nestDataForVoronoi ({ data }) {
  return merge(data)
}

function lineClassString (args) {
  return d => {
    let classString

    if (args.linked) {
      const v = d[args.xAccessor]
      const formatter = timeFormat(args.utcTime, args.linkedFormat)

      // only format when x-axis is date
      const id = (typeof v === 'number') ? (d.__lineId__ - 1) : formatter(v)
      classString = `roll_${id} mg-line${d.__lineId__}`

      if (args.color === null) {
        classString += ` mg-line${d.__lineId__}-color`
      }
      return classString
    } else {
      classString = `mg-line${d.__lineId__}`
      if (args.color === null) classString += ` mg-line${d.__lineId__}-color`
      return classString
    }
  }
}

function addVoronoiRollover (args, svg, rolloverOn, rolloverOff, rolloverMove, rolloverClick) {
  const voronoi = d3voronoi()
    .x(d => args.scales.X(d[args.xAccessor]).toFixed(2))
    .y(d => args.scales.Y(d[args.yAccessor]).toFixed(2))
    .extent([
      [args.buffer, args.buffer + (args.title ? args.titleYPosition : 0)],
      [args.width - args.buffer, args.height - args.buffer]
    ])

  const g = addG(svg, 'mg-voronoi')
  g.selectAll('path')
    .data(voronoi.polygons(nestDataForVoronoi(args)))
    .enter()
    .append('path')
    .filter(d => d !== undefined && d.length > 0)
    .attr('d', d => d == null ? null : `M${d.join('L')}Z`)
    .datum(d => d == null ? null : d.data) // because of d3.voronoi, reassign d
    .attr('class', lineClassString(args))
    .on('click', rolloverClick)
    .on('mouseover', rolloverOn)
    .on('mouseout', rolloverOff)
    .on('mousemove', rolloverMove)

  configureVoronoiRollover(args, svg)
}

function nestDataForAggregateRollover ({ xAccessor, data, xSort }) {
  const dataNested = group(data, d => d[xAccessor])
    .entries(merge(data))
  dataNested.forEach(entry => {
    const datum = entry.values[0]
    entry.key = datum[xAccessor]
  })

  if (xSort) {
    return dataNested.sort((a, b) => new Date(a.key) - new Date(b.key))
  } else {
    return dataNested
  }
}

function addAggregateRollover (args, svg, rolloverOn, rolloverOff, rolloverMove, rolloverClick) {
  // Undo the keys getting coerced to strings, by setting the keys from the values
  // This is necessary for when we have X axis keys that are things like
  const dataNested = nestDataForAggregateRollover(args)

  const xf = dataNested.map(({ key }) => args.scales.X(key))

  const g = svg.append('g')
    .attr('class', 'mg-rollover-rect')

  g.selectAll('.mg-rollover-rects')
    .data(dataNested).enter()
    .append('rect')
    .attr('x', (d, i) => {
      if (xf.length === 1) return getPlotLeft(args)
      else if (i === 0) return xf[i].toFixed(2)
      else return ((xf[i - 1] + xf[i]) / 2).toFixed(2)
    })
    .attr('y', args.top)
    .attr('width', (d, i) => {
      if (xf.length === 1) return getPlotRight(args)
      else if (i === 0) return ((xf[i + 1] - xf[i]) / 2).toFixed(2)
      else if (i === xf.length - 1) return ((xf[i] - xf[i - 1]) / 2).toFixed(2)
      else return ((xf[i + 1] - xf[i - 1]) / 2).toFixed(2)
    })
    .attr('class', ({ values }) => {
      let lineClasses = values.map(({ __lineId__ }) => {
        let lc = lineClass(__lineId__)
        if (args.colors === null) lc += ` ${lineColorClass(__lineId__)}`
        return lc
      }).join(' ')
      if (args.linked && values.length > 0) {
        lineClasses += ` ${rolloverIdClass(rolloverFormatId(values[0], args))}`
      }

      return lineClasses
    })
    .attr('height', args.height - args.bottom - args.top - args.buffer)
    .attr('opacity', 0)
    .on('click', rolloverClick)
    .on('mouseover', rolloverOn)
    .on('mouseout', rolloverOff)
    .on('mousemove', rolloverMove)

  configureAggregateRollover(args, svg)
}

function configureSingletonRollover ({ data }, svg) {
  svg.select('.mg-rollover-rect rect')
    .on('mouseover')(data[0][0], 0)
}

function configureVoronoiRollover ({ data, customLineColorMap }, svg) {
  for (let i = 0; i < data.length; i++) {
    let j = i + 1

    if (customLineColorMap.length > 0 &&
        customLineColorMap[i] !== undefined) {
      j = customLineColorMap[i]
    }

    if (data[i].length === 1 && !svg.selectAll(`.mg-voronoi .mg-line${j}`).empty()) {
      svg.selectAll(`.mg-voronoi .mg-line${j}`)
        .on('mouseover')(data[i][0], 0)

      svg.selectAll(`.mg-voronoi .mg-line${j}`)
        .on('mouseout')(data[i][0], 0)
    }
  }
}

function lineClass (lineId) {
  return `mg-line${lineId}`
}

function lineColorClass (lineId) {
  return `mg-line${lineId}-color`
}

function rolloverIdClass (id) {
  return `roll_${id}`
}

function rolloverFormatId (d, { xAccessor, utcTime, linkedFormat }) {
  const v = d[xAccessor]
  const formatter = timeFormat(utcTime, linkedFormat)
  // only format when x-axis is date
  return (typeof v === 'number') ? v.toString().replace('.', '_') : formatter(v)
}

function addSingleLineRollover (args, svg, rolloverOn, rolloverOff, rolloverMove, rolloverClick) {
  // set to 1 unless we have a custom increment series
  let lineId = 1
  if (args.customLineColorMap.length > 0) {
    lineId = args.customLineColorMap[0]
  }

  const g = svg.append('g')
    .attr('class', 'mg-rollover-rect')

  const xf = args.data[0].map(args.scaleFunctions.xf)

  g.selectAll('.mg-rollover-rects')
    .data(args.data[0]).enter()
    .append('rect')
    .attr('class', (d, i) => {
      let cl = `${lineColorClass(lineId)} ${lineClass(d.__lineId__)}`
      if (args.linked) cl += `${cl} ${rolloverIdClass(rolloverFormatId(d, args))}`
      return cl
    })
    .attr('x', (d, i) => {
      // if data set is of length 1
      if (xf.length === 1) return getPlotLeft(args)
      else if (i === 0) return xf[i].toFixed(2)
      else return ((xf[i - 1] + xf[i]) / 2).toFixed(2)
    })
    .attr('y', (d, i) => (args.data.length > 1) ? args.scaleFunctions.yf(d) - 6 // multi-line chart sensitivity
      : args.top)
    .attr('width', (d, i) => {
      // if data set is of length 1
      if (xf.length === 1) return getPlotRight(args)
      else if (i === 0) return ((xf[i + 1] - xf[i]) / 2).toFixed(2)
      else if (i === xf.length - 1) return ((xf[i] - xf[i - 1]) / 2).toFixed(2)
      else return ((xf[i + 1] - xf[i - 1]) / 2).toFixed(2)
    })
    .attr('height', (d, i) => (args.data.length > 1) ? 12 // multi-line chart sensitivity
      : args.height - args.bottom - args.top - args.buffer)
    .attr('opacity', 0)
    .on('click', rolloverClick)
    .on('mouseover', rolloverOn)
    .on('mouseout', rolloverOff)
    .on('mousemove', rolloverMove)

  if (isSingleton(args)) {
    configureSingletonRollover(args, svg)
  }
}

function configureAggregateRollover ({ data }, svg) {
  const rect = svg.selectAll('.mg-rollover-rect rect')
  const rectFirst = rect.nodes()[0][0] || rect.nodes()[0]
  if (data.filter(({ length }) => length === 1).length > 0) {
    rect.on('mouseover')(rectFirst.__data__, 0)
  }
}

function isStandardMultiline ({ data, aggregateRollover }) {
  return data.length > 1 && !aggregateRollover
}

function isAggregatedRollover ({ data, aggregateRollover }) {
  return data.length > 1 && aggregateRollover
}

function isSingleton ({ data }) {
  return data.length === 1 && data[0].length === 1
}

function drawAllLineSegments (args, plot, svg) {
  removeDanglingBands(plot, svg)

  // If option activated, remove existing active points if exists
  if (args.active_point_on_lines) {
    svg.selectAll('circle.mg-shown-active-point').remove()
  }

  for (let i = args.data.length - 1; i >= 0; i--) {
    const thisData = args.data[i]

    // passing the data for the current line
    callHook('line.before_each_series', [thisData, args])

    // override increment if we have a custom increment series
    let lineId = i + 1
    if (args.customLineColorMap.length > 0) {
      lineId = args.customLineColorMap[i]
    }

    args.data[i].__lineId__ = lineId

    // If option activated, add active points for each lines
    if (args.active_point_on_lines) {
      svg.selectAll('circle-' + lineId)
        .data(args.data[i])
        .enter()
        .filter((d) => {
          return d[args.active_point_accessor]
        })
        .append('circle')
        .attr('class', 'mg-area' + (lineId) + '-color mg-shown-active-point')
        .attr('cx', args.scaleFunctions.xf)
        .attr('cy', args.scaleFunctions.yf)
        .attr('r', () => {
          return args.active_pointSize
        })
    }

    const existingLine = svg.select(`path.mg-main-line.mg-line${lineId}`)
    if (thisData.length === 0) {
      existingLine.remove()
      continue
    }

    addConfidenceBand(args, plot, svg, lineId)

    if (Array.isArray(args.area)) {
      if (args.area[lineId - 1]) {
        addArea(args, plot, svg, i, lineId)
      }
    } else {
      addArea(args, plot, svg, i, lineId)
    }

    addLine(args, plot, svg, existingLine, i, lineId)
    addLegendElement(args, plot, i, lineId)

    // passing the data for the current line
    callHook('line.after_each_series', [thisData, existingLine, args])
  }
}

function removeDanglingBands ({ existingBand }, svg) {
  if (existingBand[0] && existingBand[0].length > svg.selectAll('.mg-main-line').node().length) {
    svg.selectAll('.mg-confidence-band').remove()
  }
}

function lineMainPlot (args) {
  const plot = {}
  const svg = getSvgChildOf(args.target)

  // remove any old legends if they exist
  selectAllAndRemove(svg, '.mg-line-legend')
  addLegendGroup(args, plot, svg)

  plot.data_median = 0
  plot.update_transition_duration = (args.transitionOnUpdate) ? 1000 : 0
  plot.display_area = (args.area && !args.use_data_y_min && args.data.length <= 1 && args.aggregateRollover === false) || (Array.isArray(args.area) && args.area.length > 0)
  plot.legendText = ''
  lineGraphGenerators(args, plot, svg)
  plot.existingBand = svg.selectAll('.mg-confidence-band').nodes()

  // should we continue with the default line render? A `line.all_series` hook should return false to prevent the default.
  const continueWithDefault = callHook('line.before_all_series', [args])
  if (continueWithDefault !== false) {
    drawAllLineSegments(args, plot, svg)
  }

  plotLegendIfLegendTarget(args.legendTarget, plot.legendText)
}

function lineRolloverSetup (args, graph) {
  const svg = getSvgChildOf(args.target)

  if (args.showActivePoint && svg.selectAll('.mg-active-datapoint-container').nodes().length === 0) {
    addG(svg, 'mg-active-datapoint-container')
  }

  removeExistingLineRolloverElements(svg)
  addRolloverCircle(args, svg)
  setUniqueLineIdForEachSeries(args)

  if (isStandardMultiline(args)) {
    addVoronoiRollover(args, svg, graph.rolloverOn(args), graph.rolloverOff(args), graph.rolloverMove(args), graph.rolloverClick(args))
  } else if (isAggregatedRollover(args)) {
    addAggregateRollover(args, svg, graph.rolloverOn(args), graph.rolloverOff(args), graph.rolloverMove(args), graph.rolloverClick(args))
  } else {
    addSingleLineRollover(args, svg, graph.rolloverOn(args), graph.rolloverOff(args), graph.rolloverMove(args), graph.rolloverClick(args))
  }
}

function updateRolloverCircle (args, svg, d) {
  if (args.aggregateRollover && args.data.length > 1) {
    // hide the circles in case a non-contiguous series is present
    svg.selectAll('circle.mg-line-rollover-circle')
      .style('opacity', 0)

    d.values.forEach((datum, index, list) => {
      if (args.missingIsHidden && list[index]._missing) {
        return
      }

      if (dataInPlotBounds(datum, args)) updateAggregateRolloverCircle(args, svg, datum)
    })
  } else if ((args.missingIsHidden && d._missing) || d[args.yAccessor] === null) {
    // disable rollovers for hidden parts of the line
    // recall that hidden parts are missing data ranges and possibly also
    // data points that have been explicitly identified as missing

  } else {
    // show circle on mouse-overed rect
    if (dataInPlotBounds(d, args)) {
      updateGenericRolloverCircle(args, svg, d)
    }
  }
}

function updateAggregateRolloverCircle ({ scales, xAccessor, yAccessor, pointSize }, svg, datum) {
  svg.select(`circle.mg-line-rollover-circle.mg-line${datum.__lineId__}`)
    .attr('cx', scales.X(datum[xAccessor]).toFixed(2))
    .attr('cy', scales.Y(datum[yAccessor]).toFixed(2))
    .attr('r', pointSize)
    .style('opacity', 1)
}

function updateGenericRolloverCircle ({ scales, xAccessor, yAccessor, pointSize }, svg, d) {
  svg.selectAll(`circle.mg-line-rollover-circle.mg-line${d.__lineId__}`)
    .classed('mg-line-rollover-circle', true)
    .attr('cx', () => scales.X(d[xAccessor]).toFixed(2))
    .attr('cy', () => scales.Y(d[yAccessor]).toFixed(2))
    .attr('r', pointSize)
    .style('opacity', 1)
}

function triggerLinkedMouseovers (args, d, i) {
  if (args.linked && !globals.link) {
    globals.link = true
    if (!args.aggregateRollover || d[args.yAccessor] !== undefined || (d.values && d.values.length > 0)) {
      const datum = d.values ? d.values[0] : d
      const id = rolloverFormatId(datum, args)
      // trigger mouseover on matching line in .linked charts
      selectAll(`.${lineClass(datum.__lineId__)}.${rolloverIdClass(id)}`)
        .each(function (d) {
          select(this)
            .on('mouseover')(d, i)
        })
    }
  }
}

function triggerLinkedMouseouts ({ linked, utcTime, linkedFormat, xAccessor }, d, i) {
  if (linked && globals.link) {
    globals.link = false

    const formatter = timeFormat(utcTime, linkedFormat)
    const datums = d.values ? d.values : [d]
    datums.forEach(datum => {
      const v = datum[xAccessor]
      const id = (typeof v === 'number') ? i : formatter(v)

      // trigger mouseout on matching line in .linked charts
      selectAll(`.roll_${id}`)
        .each(function (d) {
          select(this)
            .on('mouseout')(d)
        })
    })
  }
}

function removeActiveDatapointsForAggregateRollover (args, svg) {
  svg.selectAll('circle.mg-line-rollover-circle').filter(({ length }) => length > 1)
    .style('opacity', 0)
}

function removeActiveDatapointsForGenericRollover ({ customLineColorMap, data }, svg, lineId) {
  svg.selectAll(`circle.mg-line-rollover-circle.mg-line${lineId}`)
    .style('opacity', () => {
      let id = lineId - 1
      if (customLineColorMap.length > 0 &&
          customLineColorMap.indexOf(lineId) !== undefined
      ) {
        id = customLineColorMap.indexOf(lineId)
      }

      if (data[id].length === 1) {
        return 1
      } else {
        return 0
      }
    })
}

export default class LineChart extends AbstractChart {
  constructor (args) {
    console.log('line chart with args: ', clone(args))
    super(args)

    // sort data
    if (args.xSort) {
      this.data.forEach(d => d.sort((a, b) => a[args.xAccessor] - b[args.xAccessor]))
    }

    this.processLine()

    // set x axis format to default if not specified
    // if (!this.xAxisFormat) this.xAxisFormat = defaultXaxFormat(args)

    init(args)

    // TODO incorporate markers into calculation of x scales
    const xScale = new MGScale(args)
    xScale.namespace('x')
    xScale.numericalDomainFromData()
    xScale.numericalRange('bottom')

    const baselines = (args.baselines || []).map(d => d[args.yAccessor])

    const yScale = new MGScale(args)
    yScale.namespace('y')
    yScale.zeroBottom(true)
    yScale.inflateDomain(true)
    yScale.numericalDomainFromData(baselines)
    yScale.numericalRange('left')

    if (args.xAxis) {
      axisFactory(args)
        .namespace('x')
        .type('numerical')
        .position(args.xAxis_position)
        .rug(xRug(args))
        .label(addXLabel)
        .draw()
    }

    if (args.yAxis) {
      axisFactory(args)
        .namespace('y')
        .type('numerical')
        .position(args.yAxis_position)
        .rug(yRug(args))
        .label(addYLabel)
        .draw()
    }

    this.markers()
    this.mainPlot()
    this.rollover()
    this.windowListeners()
    if (args.brush) addBrushFunction(args)
    callHook('line.after_init', this)

    return this
  }

  processLine () {
    let timeFrame

    // are we replacing missing y values with zeros?
    if ((this.missingIsZero || this.missingIsHidden) && this.isTimeSeries) {
      for (let i = 0; i < this.data.length; i++) {
        // we need to have a dataset of length > 2, so if it's less than that, skip
        if (this.data[i].length <= 1) continue

        const first = this.data[i][0]
        const last = this.data[i][this.data[i].length - 1]

        // initialize our new array for storing the processed data
        const processedData = []

        // we'll be starting from the day after our first date
        const startDate = clone(first[this.xAccessor]).setDate(first[this.xAccessor].getDate() + 1)

        // if we've set a maxX, add data points up to there
        const from = (this.minX) ? this.minX : startDate
        const upto = (this.maxX) ? this.maxX : last[this.xAccessor]

        timeFrame = getTimeFrame((upto - from) / 1000)

        if (['four-days', 'many-days', 'many-months', 'years', 'default'].indexOf(timeFrame) !== -1 && this.missingIsHidden_accessor === null) {
          // changing the date via setDate doesn't properly register as a change within the loop
          for (let d = new Date(from); d <= upto; d.setDate(d.getDate() + 1)) { // eslint-disable-line
            const o = {}
            d.setHours(0, 0, 0, 0)

            // add the first date item, we'll be starting from the day after our first date
            if (Date.parse(d) === Date.parse(new Date(startDate))) {
              processedData.push(clone(this.data[i][0]))
            }

            // check to see if we already have this date in our data object
            let existingO = null
            this.data[i].forEach(function (val, i) {
              if (Date.parse(val[this.xAccessor]) === Date.parse(new Date(d))) {
                existingO = val

                return false
              }
            })

            // if we don't have this date in our data object, add it and set it to zero
            if (!existingO) {
              o[this.xAccessor] = new Date(d)
              o[this.yAccessor] = 0
              o._missing = true // we want to distinguish between zero-value and missing observations
              processedData.push(o)

            // if the data point has, say, a 'missing' attribute set or if its
            // y-value is null identify it internally as missing
            } else if (existingO[this.missingIsHidden_accessor] || existingO[this.yAccessor] === null) {
              existingO._missing = true
              processedData.push(existingO)

            // otherwise, use the existing object for that date
            } else {
              processedData.push(existingO)
            }
          }
        } else {
          for (let j = 0; j < this.data[i].length; j += 1) {
            const obj = clone(this.data[i][j])
            obj._missing = this.data[i][j][this.missingIsHidden_accessor]
            processedData.push(obj)
          }
        }

        // update our date object
        this.data[i] = processedData
      }
    }
  }

  mainPlot () { lineMainPlot(this.args) }
  markers () { markers(this.args) }

  rollover () {
    lineRolloverSetup(this.args, this)
    callHook('line.after_rollover', this.args)
  }

  rolloverClick () {
    return (d, i) => {
      if (this.args.click) {
        this.args.click(d, i)
      }
    }
  }

  rolloverOn () {
    const svg = getSvgChildOf(this.args.target)

    return (d, i) => {
      updateRolloverCircle(this.args, svg, d)
      triggerLinkedMouseovers(this.args, d, i)

      svg.selectAll('text')
        .filter((g, j) => d === g)
        .attr('opacity', 0.3)

      // update rollover text except for missing data points
      if (this.args.show_rollover_text &&
        !((this.args.missingIsHidden && d._missing) || d[this.args.yAccessor] === null)
      ) {
        const mouseover = mouseoverText(this.args, { svg })
        let row = mouseover.mouseover_row()
        if (this.args.aggregateRollover) {
          row.text((this.args.aggregateRollover && this.args.data.length > 1
            ? formatXAggregateMouseover
            : formatXMouseover)(this.args, d))
        }

        const pts = this.args.aggregateRollover && this.args.data.length > 1
          ? d.values
          : [d]

        pts.forEach(di => {
          if (this.args.aggregateRollover) {
            row = mouseover.mouseover_row()
          }

          if (this.args.legend) {
            lineColorText(row.text(`${this.args.legend[di.__index__ - 1]}  `).bold(), di.__lineId__, this.args)
          }

          lineColorText(row.text('\u2014  ').elem, di.__lineId__, this.args)
          if (!this.args.aggregateRollover) {
            row.text(formatXMouseover(this.args, di))
          }

          row.text(formatYMouseover(this.args, di, this.args.timeSeries === false))
        })
      }

      if (this.args.mouseover) this.args.mouseover(d, i)
    }
  }

  rolloverOff () {
    const svg = getSvgChildOf(this.args.target)

    return (d, i) => {
      triggerLinkedMouseouts(this.args, d, i)
      if (this.args.aggregateRollover) {
        removeActiveDatapointsForAggregateRollover(this.args, svg)
      } else {
        removeActiveDatapointsForGenericRollover(this.args, svg, d.__lineId__)
      }

      if (this.args.data[0].length > 1) {
        clearMouseoverContainer(svg)
      }

      if (this.args.mouseout) {
        this.args.mouseout(d, i)
      }
    }
  }

  rolloverMove () {
    return (d, i) => {
      if (this.args.mousemove) {
        this.args.mousemove(d, i)
      }
    }
  }

  windowListeners () { return windowListeners(this.args) }
}
