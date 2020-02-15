import { getPlotLeft, getPlotRight, getPlotBottom, getBottom, preventHorizontalOverlap, getSvgChildOf } from '../misc/utility'
import { select } from 'selection'

export function returnLabel (d) { return d.label }

export function removeExistingMarkers (svg) {
  svg.selectAll('.mg-markers').remove()
  svg.selectAll('.mg-baselines').remove()
}

export function inRange (args) {
  return function (d) {
    return (args.scales.X(d[args.xAccessor]) >= getPlotLeft(args)) && (args.scales.X(d[args.xAccessor]) <= getPlotRight(args))
  }
}

export function xPosition (args) {
  return function (d) {
    return args.scales.X(d[args.xAccessor])
  }
}

export function xPositionFixed (args) {
  return d => xPosition(args).toFixed(2)
}

export function yPositionFixed (args) {
  return d => args.scales.Y(d.value).toFixed(2)
}

export function placeAnnotations (checker, className, args, svg, lineFunction, textFunction) {
  if (!checker) return
  const g = svg.append('g').attr('class', className)
  lineFunction(g, args)
  textFunction(g, args)
}

export function placeMarkers (args, svg) {
  placeAnnotations(args.markers, 'mg-markers', args, svg, placeMarkerLines, placeMarkerText)
}

export function placeBaselines (args, svg) {
  placeAnnotations(args.baselines, 'mg-baselines', args, svg, placeBaselineLines, placeBaselineText)
}

export function placeMarkerLines (gm, args) {
  var xPosFixed = xPositionFixed(args)
  gm.selectAll('.mg-markers')
    .data(args.markers.filter(inRange(args)))
    .enter()
    .append('line')
    .attr('x1', xPosFixed)
    .attr('x2', xPosFixed)
    .attr('y1', args.top)
    .attr('y2', getPlotBottom(args))
    .attr('class', function (d) {
      return d.lineClass
    })
    .attr('stroke-dasharray', '3,1')
}

export function placeMarkerText (gm, args) {
  gm.selectAll('.mg-markers')
    .data(args.markers.filter(inRange(args)))
    .enter()
    .append('text')
    .attr('class', function (d) {
      return d.textClass || ''
    })
    .classed('mg-marker-text', true)
    .attr('x', xPosition(args))
    .attr('y', args.xAxis_position === 'bottom' ? args.top * 0.95 : getBottom(args) + args.buffer)
    .attr('text-anchor', 'middle')
    .text(returnLabel)
    .each(function (d) {
      if (d.click) {
        select(this).style('cursor', 'pointer')
          .on('click', d.click)
      }
      if (d.mouseover) {
        select(this).style('cursor', 'pointer')
          .on('mouseover', d.mouseover)
      }
      if (d.mouseout) {
        select(this).style('cursor', 'pointer')
          .on('mouseout', d.mouseout)
      }
    })

  preventHorizontalOverlap(gm.selectAll('.mg-marker-text').nodes(), args)
}

export function placeBaselineLines (gb, args) {
  var yPos = yPositionFixed(args)
  gb.selectAll('.mg-baselines')
    .data(args.baselines)
    .enter().append('line')
    .attr('x1', getPlotLeft(args))
    .attr('x2', getPlotRight(args))
    .attr('y1', yPos)
    .attr('y2', yPos)
}

export function placeBaselineText (gb, args) {
  var yPos = yPositionFixed(args)
  gb.selectAll('.mg-baselines')
    .data(args.baselines)
    .enter().append('text')
    .attr('x', getPlotRight(args))
    .attr('y', yPos)
    .attr('dy', -3)
    .attr('text-anchor', 'end')
    .text(returnLabel)
}

export function markers (args) {
  'use strict'

  var svg = getSvgChildOf(args.target)
  removeExistingMarkers(svg)
  placeMarkers(args, svg)
  placeBaselines(args, svg)
  return this
}
