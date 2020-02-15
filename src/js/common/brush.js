{
  const get_extent_rect = args => {
    return d3.select(args.target).select('.mg-extent').size()
      ? d3.select(args.target).select('.mg-extent')
      : d3.select(args.target)
        .select('.mg-rollover-rect, .mg-voronoi')
        .insert('g', '*')
        .classed('mg-brush', true)
        .append('rect')
        .classed('mg-extent', true)
  }

  const createBrushingPattern = (args, range) => {
    const x = range.x[0]
    const width = range.x[1] - range.x[0]
    const y = range.y[0]
    const height = range.y[1] - range.y[0]
    get_extent_rect(args)
      .attr('x', x)
      .attr('width', width)
      .attr('y', y)
      .attr('height', height)
      .attr('opacity', 1)
  }

  const removeBrushingPattern = args => {
    get_extent_rect(args)
      .attr('width', 0)
      .attr('height', 0)
      .attr('opacity', 0)
  }

  const add_event_handler_for_brush = (args, target, axis) => {
    const svg = d3.select(args.target).select('svg')
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
      const mouse = d3.mouse(container)
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
      origin = d3.mouse(container)
      svg.classed('mg-brushed', false)
      svg.classed('mg-brushing-in-progress', true)
      removeBrushingPattern(args)
    })
    d3.select(document).on('mousemove.' + targetUid, () => {
      if (mouseDown) {
        isDragging = true
        rollover.classed('mg-brushing', true)
        createBrushingPattern(args, calculateSelectionRange())
      }
    })
    d3.select(document).on('mouseup.' + targetUid, () => {
      if (!mouseDown) return
      mouseDown = false
      svg.classed('mg-brushing-in-progress', false)
      const range = calculateSelectionRange()
      if (isDragging) {
        isDragging = false
        if (target === args) {
          MG.zoomToDataRange(target, range)
          if (args.click_to_zoom_out) { svg.select('.mg-rollover-rect, .mg-voronoi').classed('mg-brushed', true) }
        } else {
          const domain = MG.convertRangeToDomain(args, range)
          MG.zoomToDataDomain(target, domain)
        }
      } else if (args.click_to_zoom_out) {
        MG.zoomToRawRange(target)
      }
      if (mg_is_function(args.brushing_selection_changed)) { args.brushing_selection_changed(args, range) }
    })
  }

  const add_brush_function = args => {
    if (args.xAxis_type === 'categorical' || args.yAxis_type === 'categorical') { return console.warn('The option "brush" does not support axis type "categorical" currently.') }
    if (!args.zoom_target) args.zoom_target = args
    if (args.zoom_target !== args) args.zoom_target.processed.subplot = args
    let brush_axis
    switch (args.brush) {
      case 'x':
        brush_axis = { x: true, y: false }
        break
      case 'y':
        brush_axis = { x: false, y: true }
        break
      case 'xy':
        brush_axis = { x: true, y: true }
        break
      default:
        brush_axis = { x: true, y: true }
    }
    add_event_handler_for_brush(args, args.zoom_target, brush_axis)
  }

  MG.add_brush_function = add_brush_function
  MG.createBrushingPattern = createBrushingPattern
  MG.removeBrushingPattern = removeBrushingPattern
}
