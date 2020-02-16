import { zoomToRawRange, zoomToDataDomain, convertRangeToDomain, zoomToDataRange } from './zoom'
import { select, mouse as d3mouse } from 'd3-selection'
import { targetRef } from '../misc/utility'

export function getExtentRect (args) {
  return select(args.target).select('.mg-extent').size()
    ? select(args.target).select('.mg-extent')
    : select(args.target)
      .select('.mg-rollover-rect, .mg-voronoi')
      .insert('g', '*')
      .classed('mg-brush', true)
      .append('rect')
      .classed('mg-extent', true)
}

export function createBrushingPattern (args, range) {
  const x = range.x[0]
  const width = range.x[1] - range.x[0]
  const y = range.y[0]
  const height = range.y[1] - range.y[0]
  getExtentRect(args)
    .attr('x', x)
    .attr('width', width)
    .attr('y', y)
    .attr('height', height)
    .attr('opacity', 1)
}

export function removeBrushingPattern (args) {
  getExtentRect(args)
    .attr('width', 0)
    .attr('height', 0)
    .attr('opacity', 0)
}

export function addEventHandlerForBrush (args, target, axis) {
  const svg = select(args.target).select('svg')
  const rollover = svg.select('.mg-rollover-rect, .mg-voronoi')
  const container = rollover.node()
  const targetUid = targetRef(args.target)
  let isDragging = false
  let mouseDown = false
  let origin = []

  const calculateSelectionRange = () => {
    const minX = args.left
    const maxX = args.width - args.right - args.buffer
    const minY = args.top
    const maxY = args.height - args.bottom - args.buffer
    const mouse = d3mouse(container)
    const range = {}
    range.x = axis.x ? [
      Math.max(minX, Math.min(origin[0], mouse[0])),
      Math.min(maxX, Math.max(origin[0], mouse[0]))
    ] : [minX, maxX]
    range.y = axis.y ? [
      Math.max(minY, Math.min(origin[1], mouse[1])),
      Math.min(maxY, Math.max(origin[1], mouse[1]))
    ] : [minY, maxY]
    return range
  }

  rollover.classed('mg-brush-container', true)
  rollover.on('mousedown.' + targetUid, () => {
    mouseDown = true
    isDragging = false
    origin = d3mouse(container)
    svg.classed('mg-brushed', false)
    svg.classed('mg-brushing-in-progress', true)
    removeBrushingPattern(args)
  })
  select(document).on('mousemove.' + targetUid, () => {
    if (mouseDown) {
      isDragging = true
      rollover.classed('mg-brushing', true)
      createBrushingPattern(args, calculateSelectionRange())
    }
  })
  select(document).on('mouseup.' + targetUid, () => {
    if (!mouseDown) return
    mouseDown = false
    svg.classed('mg-brushing-in-progress', false)
    const range = calculateSelectionRange()
    if (isDragging) {
      isDragging = false
      if (target === args) {
        zoomToDataRange(target, range)
        if (args.click_to_zoom_out) { svg.select('.mg-rollover-rect, .mg-voronoi').classed('mg-brushed', true) }
      } else {
        const domain = convertRangeToDomain(args, range)
        zoomToDataDomain(target, domain)
      }
    } else if (args.click_to_zoom_out) {
      zoomToRawRange(target)
    }
    if (typeof args.brushing_selection_changed === 'function') args.brushing_selection_changed(args, range)
  })
}

export function addBrushFunction (args) {
  if (args.xAxisType === 'categorical' || args.yAxisType === 'categorical') { return console.warn('The option "brush" does not support axis type "categorical" currently.') }
  if (!args.zoom_target) args.zoom_target = args
  if (args.zoom_target !== args) args.zoom_target.processed.subplot = args
  let brushAxis
  switch (args.brush) {
    case 'x':
      brushAxis = { x: true, y: false }
      break
    case 'y':
      brushAxis = { x: false, y: true }
      break
    case 'xy':
      brushAxis = { x: true, y: true }
      break
    default:
      brushAxis = { x: true, y: true }
  }
  addEventHandlerForBrush(args, args.zoom_target, brushAxis)
}
