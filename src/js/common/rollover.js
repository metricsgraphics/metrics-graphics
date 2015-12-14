function mg_append_tspan_to_container(svg, text) {
  var cl = null;
  if (arguments.length===3) {
    cl = arguments[2];
  }
  var elem = svg.append('tspan').text(text);
  if (cl) elem.classed(cl, true);
  return elem;
}



function mg_reset_active_datapoint_text(svg) {
    var textContainer = svg.select('.mg-active-datapoint');
    textContainer
      .selectAll('*')
      .remove();  
    return textContainer;  
}

function mg_format_aggregate_rollover_text(args, svg, textContainer, formatted_x, formatted_y, num, fmt, d, i) {
  var lineCount = 0;
  var lineHeight = 1.1;
  if (args.time_series) {
    mg_append_aggregate_rollover_timeseries(args, textContainer, formatted_x, d, num);

  } else {
    mg_append_aggregate_rollover_text(args, textContainer, formatted_x, d, num);
}

  // append an blank (&nbsp;) line to mdash positioning
  textContainer.append('tspan')
    .attr('x', 0)
    .attr('y', (lineCount * lineHeight) + 'em')
    .text('\u00A0');
}

function mg_append_aggregate_rollover_timeseries (args, textContainer, formatted_x, d, num) {
  var lineCount = 0;
  var lineHeight = 1.1;
  var formatted_y;
  textContainer.append('tspan')
    .text(formatted_x.trim());

  lineCount = 1;
  var fy;

  d.values.forEach(function (datum) {
    formatted_y = mg_format_y_rollover(args, num, datum);

    var label = textContainer.append('tspan')
      .attr({
        x: 0,
        y: (lineCount * lineHeight) + 'em'
      })
      .text(formatted_y);

    textContainer.append('tspan')
      .attr({
        x: -label.node().getComputedTextLength(),
        y: (lineCount * lineHeight) + 'em'
      })
      .text('\u2014 ') // mdash
      .classed('mg-hover-line' + datum.line_id + '-color', args.colors === null)
      .attr('fill', args.colors === null ? '' : args.colors[datum.line_id - 1])
      .style('font-weight', 'bold');

    lineCount++;
  });
  // necessary blank line.
  textContainer.append('tspan')
    .attr('x', 0)
    .attr('y', (lineCount * lineHeight) + 'em')
    .text('\u00A0');
}

function mg_append_aggregate_rollover_text(args, textContainer, formatted_x, d, num) {  
  var lineCount = 0;
  var lineHeight = 1.1; 
  d.values.forEach(function (datum) {
    formatted_y = mg_format_y_rollover(args, num, datum);

    if (args.y_rollover_format !== null) {
      formatted_y = number_rollover_format(args.y_rollover_format, datum, args.y_accessor);
    } else {
      formatted_y = args.yax_units + num(datum[args.y_accessor]);
    }

    var label = textContainer.append('tspan')
      .attr({
        x: 0,
        y: (lineCount * lineHeight) + 'em'
      })
      .text(formatted_x + ' ' + formatted_y);

    textContainer.append('tspan')
      .attr({
        x: -label.node().getComputedTextLength(),
        y: (lineCount * lineHeight) + 'em'
      })
      .text('\u2014 ') // mdash
      .classed('mg-hover-line' + datum.line_id + '-color', true)
      .style('font-weight', 'bold');

    lineCount++;
  });
}

function mg_color_rollover_line (args, svg_elem, d) {
  svg_elem.classed('mg-hover-line' + d.line_id + '-color', args.colors === null)
    .attr('stroke', args.colors === null ? '' : args.colors[d.line_id - 1]); 
}

function mg_add_label_rollover_text (args, textContainer, d) {
  // label.
  if (args.legend || args.label_accessor) {
    var label=textContainer.append('tspan')
      .text(args.chart_type ==='line' ? args.legend[d.line_id-1] + '  ' : d[args.label_accessor] + '  ');
    if (args.chart_type==='line') {
      mg_color_rollover_line(args, label, d);

    } else if (args.chart_type==='point') {
      if (args.color_accessor !== null) {
          label.attr('fill',   args.scalefns.color(d));
      } else {
          label.classed('mg-points-mono', true);
      }
    }
  }
}

function mg_update_rollover_text(args, svg, fmt, shape, d, i) {
    var num = format_rollover_number(args);
    var textContainer = mg_reset_active_datapoint_text(svg);
    var formatted_y = mg_format_y_rollover(args, num, d);
    var formatted_x = mg_format_x_rollover(args, fmt, d);

    // rollover text when aggregate_rollover is enabled
    if (args.aggregate_rollover && args.data.length > 1) {
      mg_format_aggregate_rollover_text(args, svg, textContainer, formatted_x, formatted_y, num, fmt, d, i);

    } else {
      // rollover text when aggregate_rollover is not enabled
      if (args.time_series) textContainer.select('*').remove();

      mg_add_label_rollover_text(args, textContainer, d);

      if (args.data.length > 1 || args.chart_type == 'point') {
        var shape_color = textContainer.append('tspan')
          .text(shape + '  ')
          .style('font-weight', 'bold');
        if (args.chart_type==='line') {
          mg_color_rollover_line(args, shape_color, d);

        } else if (args.chart_type==='point') {
          if (args.color_accessor !== null) {
              shape_color.attr('fill',   args.scalefns.color(d));
              shape_color.attr('stroke', args.scalefns.color(d));
          } else {
              shape_color.classed('mg-points-mono', true);
          }
        }
      } 

      if (args.time_series) {
        mg_append_tspan_to_container(textContainer, formatted_x, 'mg-x-rollover-text');
        mg_append_tspan_to_container(textContainer, formatted_y, 'mg-y-rollover-text');
      } else {
        textContainer.append('tspan')
          .text(formatted_x);
        textContainer.append('tspan')
          .text(formatted_y);
      }
    }
}