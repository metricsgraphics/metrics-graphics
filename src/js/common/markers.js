function mg_return_label (d) {
  return d.label
}

function mg_remove_existing_markers (svg) {
  svg.selectAll('.mg-markers').remove()
  svg.selectAll('.mg-baselines').remove()
}

function mg_in_range (args) {
  return function (d) {
    return (args.scales.X(d[args.xAccessor]) >= getPlotLeft(args)) && (args.scales.X(d[args.xAccessor]) <= getPlotRight(args))
  }
}

function mg_x_position (args) {
  return function (d) {
    return args.scales.X(d[args.xAccessor])
  }
}

function mg_x_position_fixed (args) {
  var _mg_x_pos = mg_x_position(args)
  return function (d) {
    return _mg_x_pos(d).toFixed(2)
  }
}

function mg_yPosition_fixed (args) {
  var _mg_y_pos = args.scales.Y
  return function (d) {
    return _mg_y_pos(d.value).toFixed(2)
  }
}

function mg_place_annotations (checker, class_name, args, svg, line_fcn, text_fcn) {
  var g
  if (checker) {
    g = svg.append('g').attr('class', class_name)
    line_fcn(g, args)
    text_fcn(g, args)
  }
}

function mg_place_markers (args, svg) {
  mg_place_annotations(args.markers, 'mg-markers', args, svg, mg_place_marker_lines, mg_place_marker_text)
}

function mg_place_baselines (args, svg) {
  mg_place_annotations(args.baselines, 'mg-baselines', args, svg, mg_place_baseline_lines, mg_place_baseline_text)
}

function mg_place_marker_lines (gm, args) {
  var x_pos_fixed = mg_x_position_fixed(args)
  gm.selectAll('.mg-markers')
    .data(args.markers.filter(mg_in_range(args)))
    .enter()
    .append('line')
    .attr('x1', x_pos_fixed)
    .attr('x2', x_pos_fixed)
    .attr('y1', args.top)
    .attr('y2', getPlotBottom(args))
    .attr('class', function (d) {
      return d.lineclass
    })
    .attr('stroke-dasharray', '3,1')
}

function mg_place_marker_text (gm, args) {
  gm.selectAll('.mg-markers')
    .data(args.markers.filter(mg_in_range(args)))
    .enter()
    .append('text')
    .attr('class', function (d) {
      return d.textclass || ''
    })
    .classed('mg-marker-text', true)
    .attr('x', mg_x_position(args))
    .attr('y', args.xAxis_position === 'bottom' ? args.top * 0.95 : getBottom(args) + args.buffer)
    .attr('text-anchor', 'middle')
    .text(mg_return_label)
    .each(function (d) {
      if (d.click) {
        d3.select(this).style('cursor', 'pointer')
          .on('click', d.click)
      }
      if (d.mouseover) {
        d3.select(this).style('cursor', 'pointer')
          .on('mouseover', d.mouseover)
      }
      if (d.mouseout) {
        d3.select(this).style('cursor', 'pointer')
          .on('mouseout', d.mouseout)
      }
    })

  preventHorizontalOverlap(gm.selectAll('.mg-marker-text').nodes(), args)
}

function mg_place_baseline_lines (gb, args) {
  var y_pos = mg_yPosition_fixed(args)
  gb.selectAll('.mg-baselines')
    .data(args.baselines)
    .enter().append('line')
    .attr('x1', getPlotLeft(args))
    .attr('x2', getPlotRight(args))
    .attr('y1', y_pos)
    .attr('y2', y_pos)
}

function mg_place_baseline_text (gb, args) {
  var y_pos = mg_yPosition_fixed(args)
  gb.selectAll('.mg-baselines')
    .data(args.baselines)
    .enter().append('text')
    .attr('x', getPlotRight(args))
    .attr('y', y_pos)
    .attr('dy', -3)
    .attr('text-anchor', 'end')
    .text(mg_return_label)
}

function markers (args) {
  'use strict'

  var svg = getSvgChildOf(args.target)
  mg_remove_existing_markers(svg)
  mg_place_markers(args, svg)
  mg_place_baselines(args, svg)
  return this
}

MG.markers = markers
