function mg_plot_area_bottom (args) {
  return args.height - args.bottom - args.buffer;
}

function mg_return_label (d) {
  return d.label;
}

function mg_remove_existing_markers (svg) {
  svg.selectAll('.mg-markers').remove();
  svg.selectAll('.mg-baselines').remove();
}

function mg_in_range (args) {
  return function (d) {
    return (args.scales.X(d[args.x_accessor]) > args.buffer + args.left)
    && (args.scales.X(d[args.x_accessor]) < args.width - args.buffer - args.right);
  };
}

function mg_x_position (args) {
  return function (d) {
    return args.scales.X(d[args.x_accessor]);
  };
}

function mg_x_position_fixed (args) {
  var _mg_x_pos = mg_x_position(args);
  return function (d) {
    return _mg_x_pos(d).toFixed(2);
  };
}

function mg_y_position_fixed (args) {
  var _mg_y_pos = args.scales.Y;
  return function (d) {
    return _mg_y_pos(d.value).toFixed(2);
  };
}

function mg_place_annotations(checker, class_name, args, svg, line_fcn, text_fcn){
    var g;
    if (checker) {
        g = svg.append('g').attr('class', class_name);
        line_fcn(g, args);
        text_fcn(g, args);
    }
}

function mg_place_markers (args, svg) {
  mg_place_annotations(args.markers, 'mg-markers', args, svg, mg_place_marker_lines, mg_place_marker_text);
}

function mg_place_baselines (args, svg) {
  mg_place_annotations(args.baselines, 'mg-baselines', args, svg, mg_place_baseline_lines, mg_place_baseline_text);   
}

function mg_place_marker_lines (gm, args) {
  var x_pos_fixed = mg_x_position_fixed(args);
  gm.selectAll('.mg-markers')
    .data(args.markers.filter(mg_in_range(args)))
    .enter()
    .append('line')
    .attr('x1', x_pos_fixed)
    .attr('x2', x_pos_fixed)
    .attr('y1', args.top)
    .attr('y2', mg_plot_area_bottom(args))
    .attr('class', function (d) {
      return d.lineclass;
    })
    .attr('stroke-dasharray', '3,1');
}

function mg_place_marker_text (gm, args) {
  gm.selectAll('.mg-markers')
    .data(args.markers.filter(mg_in_range(args)))
    .enter()
    .append('text')
    .attr('class', function (d) {
      return d.textclass ? 'mg-marker-text ' + d.textclass : 'mg-marker-text';
    })
    .attr('x', mg_x_position(args))
    .attr('y', args.top * 0.95)
    .attr('text-anchor', 'middle')
    .text(mg_return_label)
    .each(function (d) {
      if (d.click) d3.select(this).style('cursor', 'pointer').on('click', d.click);
    });
  preventHorizontalOverlap(gm.selectAll('.mg-marker-text')[0], args);
}

function mg_place_baseline_lines (gb, args) {
  var y_pos = mg_y_position_fixed(args);
  gb.selectAll('.mg-baselines')
    .data(args.baselines)
    .enter().append('line')
    .attr('x1', args.left + args.buffer)
    .attr('x2', args.width - args.right - args.buffer)
    .attr('y1', y_pos)
    .attr('y2', y_pos);
}

function mg_place_baseline_text (gb, args) {
  var y_pos = mg_y_position_fixed(args);
  gb.selectAll('.mg-baselines')
    .data(args.baselines)
    .enter().append('text')
    .attr('x', args.width - args.right - args.buffer)
    .attr('y', y_pos)
    .attr('dy', -3)
    .attr('text-anchor', 'end')
    .text(mg_return_label);
}

function markers (args) {
  'use strict';
  var svg = mg_get_svg_child_of(args.target);
  mg_remove_existing_markers(svg);
  mg_place_markers(args, svg);
  mg_place_baselines(args, svg);
  return this;
}

MG.markers = markers;
