{

const get_extent_rect = args => {
  return d3.select(args.target).select('.mg-extent').size()
    ? d3.select(args.target).select('.mg-extent')
    : d3.select(args.target)
      .select('.mg-rollover-rect, .mg-voronoi')
      .insert('g', '*')
      .classed('mg-brush', true)
      .append('rect')
      .classed('mg-extent', true);
};

const create_brushing_pattern = (args, range) => {
  const x = range.x[0];
  const width = range.x[1] - range.x[0];
  const y = range.y[0];
  const height = range.y[1] - range.y[0];
  get_extent_rect(args)
    .attr('x', x)
    .attr('width', width)
    .attr('y', y)
    .attr('height', height)
    .attr('opacity', 1);
};

const remove_brushing_pattern = args => {
  get_extent_rect(args)
    .attr('width', 0)
    .attr('height', 0)
    .attr('opacity', 0);
};

const add_event_handler_for_brush = (args, target, axis) => {
  const svg = d3.select(args.target).select('svg');
  const rollover = svg.select('.mg-rollover-rect, .mg-voronoi');
  const container = rollover.node();
  let isDragging = false;
  let mouseDown = false;
  let origin = [];

  const calculateSelectionRange = () => {
    const min_x = args.left;
    const max_x = args.width - args.right - args.buffer;
    const min_y = args.top;
    const max_y = args.height - args.bottom - args.buffer;
    const mouse = d3.mouse(container);
    const range = {};
    range.x = axis.x ? [
      Math.max(min_x, Math.min(origin[0], mouse[0])),
      Math.min(max_x, Math.max(origin[0], mouse[0]))
    ] : [min_x, max_x];
    range.y = axis.y ? [
      Math.max(min_y, Math.min(origin[1], mouse[1])),
      Math.min(max_y, Math.max(origin[1], mouse[1]))
    ] : [min_y, max_y];
    return range;
  };

  rollover.classed('mg-brush-container', true);
  rollover.on('mousedown.' + args.target, () => {
    mouseDown = true;
    isDragging = false;
    origin = d3.mouse(container);
    svg.classed('mg-brushed', false);
    svg.classed('mg-brushing-in-progress', true);
    remove_brushing_pattern(args);
  });
  d3.select(document).on('mousemove.' + args.target, () => {
    if (mouseDown) {
      isDragging = true;
      rollover.classed('mg-brushing', true);
      create_brushing_pattern(args, calculateSelectionRange());
    }
  });
  d3.select(document).on('mouseup.' + args.target, () => {
    if (!mouseDown) return;
    mouseDown = false;
    svg.classed('mg-brushing-in-progress', false);
    const range = calculateSelectionRange();
    if (isDragging) {
      isDragging = false;
      if (target === args) {
        MG.zoom_to_data_range(target, range);
        svg.select('.mg-rollover-rect, .mg-voronoi').classed('mg-brushed', true);
      } else {
        const domain = MG.convert_range_to_domain(args, range);
        MG.zoom_to_data_domain(target, domain);
      }
    } else {
      MG.zoom_to_raw_range(target);
    }
    if (mg_is_function(args.brushing_selection_changed))
      args.brushing_selection_changed(args, range);
  });
};

const add_brush_function = args => {
  if (args.x_axis_type === 'categorical' || args.y_axis_type === 'categorical')
    return console.warn('The option "brush" does not support axis type "categorical" currently.');
  if (!args.zoom_target) args.zoom_target = args;
  if (args.zoom_target !== args) args.zoom_target.processed.subplot = args;
  let brush_axis;
  switch (args.brush) {
    case 'x':
      brush_axis = {x: true, y: false};
      break;
    case 'y':
      brush_axis = {x: false, y: true};
      break;
    case 'xy':
      brush_axis = {x: true, y: true};
      break;
    default:
      brush_axis = {x: true, y: true};
  }
  add_event_handler_for_brush(args, args.zoom_target, brush_axis);
};

MG.add_brush_function = add_brush_function;
MG.create_brushing_pattern = create_brushing_pattern;
MG.remove_brushing_pattern = remove_brushing_pattern;

}
