// // function mg_rollover(svg, rargs) {
// //   return (function(){
// //     this.rollover = mg_reset_active_datapoint_text(svg);
// //     this.target = rargs.target;

// //   })
// // }

// function mouseover_tspan (svg, text) {
//   var tspan = '';
//   var cl = null;
//   if (arguments.length === 3) cl = arguments[2];
//   tspan = svg.append('tspan').text(text);
//   if (cl !== null) tspan.classed(cl, true);

//   return (function () {
//     this.tspan = tspan;

//     this.bold = function () {
//       this.tspan.attr('font-weight', 'bold');
//       return this;
//     };
//     this.color = function (args, d) {
//       if (args.chart_type === 'line') {
//         this.tspan.classed('mg-hover-line' + d.line_id + '-color', args.colors === null)
//           .attr('stroke', args.colors === null ? '' : args.colors[d.line_id - 1]);
//       } else if (args.chart_type === 'point') {
//         if (args.color_accessor !== null) {
//           this.tspan.attr('fill', args.scalefns.color(d));
//           this.tspan.attr('stroke', args.scalefns.color(d));
//         } else {
//           this.tspan.classed('mg-points-mono', true);
//         }
//       }
//     };
//     this.x = function (x) {
//       this.tspan.attr('x', x);
//       return this;
//     };
//     this.y = function (y) {
//       this.tspan.attr('y', y);
//       return this;
//     };
//     this.elem = function () {
//       return this.tspan;
//     };
//     return this;
//   })();
// }

// function mg_reset_active_datapoint_text (svg) {
//   var textContainer = svg.select('.mg-active-datapoint');
//   textContainer
//     .selectAll('*')
//     .remove();
//   return textContainer;
// }

// function mg_format_aggregate_rollover_text (args, svg, textContainer, formatted_x, formatted_y, num, fmt, d, i) {
//   var lineCount = 0;
//   var lineHeight = 1.1;
//   if (args.time_series) {
//     mg_append_aggregate_rollover_timeseries(args, textContainer, formatted_x, d, num);
//   } else {
//     mg_append_aggregate_rollover_text(args, textContainer, formatted_x, d, num);
//   }

//   // append an blank (&nbsp;) line to mdash positioning
//   mouseover_tspan(textContainer, '\u00A0').x(0).y((lineCount * lineHeight) + 'em');
// }

// function mg_append_aggregate_rollover_timeseries (args, textContainer, formatted_x, d, num) {
//   var lineCount = 0;
//   var lineHeight = 1.1;
//   var formatted_y;

//   mouseover_tspan(textContainer, formatted_x.trim());

//   lineCount = 1;
//   var sub_container;
//   d.values.forEach(function (datum) {
//     sub_container = textContainer.append('tspan').attr('x', 0).attr('y', (lineCount * lineHeight) + 'em');
//     formatted_y = mg_format_y_rollover(args, num, datum);
//     mouseover_tspan(sub_container, '\u2014  ')
//       .color(args, datum);
//     mouseover_tspan(sub_container, formatted_y);

//     lineCount++;
//   });
//   // necessary blank line.
//   mouseover_tspan(textContainer, '\u00A0').x(0).y((lineCount * lineHeight) + 'em');
// }

// function mg_append_aggregate_rollover_text (args, textContainer, formatted_x, d, num) {
//   var lineCount = 0;
//   var lineHeight = 1.1;
//   d.values.forEach(function (datum) {
//     formatted_y = mg_format_y_rollover(args, num, datum);

//     if (args.y_rollover_format !== null) {
//       formatted_y = number_rollover_format(args.y_rollover_format, datum, args.y_accessor);
//     } else {
//       formatted_y = args.yax_units + num(datum[args.y_accessor]);
//     }

//     sub_container = textContainer.append('tspan').attr('x', 0).attr('y', (lineCount * lineHeight) + 'em');
//     formatted_y = mg_format_y_rollover(args, num, datum);
//     mouseover_tspan(sub_container, '\u2014  ')
//       .color(args, datum);
//     mouseover_tspan(sub_container, formatted_x + ' ' + formatted_y);

//     lineCount++;
//   });
// }

// function mg_update_rollover_text (args, svg, fmt, shape, d, i) {
//   var num = format_rollover_number(args);
//   if (args.chart_type === 'bar') num = function(d){return d};
//   var textContainer = mg_reset_active_datapoint_text(svg);
//   var formatted_y = mg_format_y_rollover(args, num, d);
//   var formatted_x = mg_format_x_rollover(args, fmt, d);

//   // rollover text when aggregate_rollover is enabled
//   if (args.aggregate_rollover && args.data.length > 1) {
//     mg_format_aggregate_rollover_text(args, svg, textContainer, formatted_x, formatted_y, num, fmt, d, i);

//   } else {
//     // rollover text when aggregate_rollover is not enabled
//     if (args.time_series) textContainer.select('*').remove();

//     // label.
//     if (!args.chart_type === 'bar' && (args.legend || args.label_accessor)) {
//       mouseover_tspan(textContainer,
//         args.chart_type === 'line' ? args.legend[d.line_id - 1] + '  ' : d[args.label_accessor] + '  ')
//         .color(args, d);
//     }

//     if (args.chart_type === 'bar' && args.group_accessor) mouseover_tspan(textContainer, d[args.group_accessor] + '   ', 'mg-bar-group-rollover-text').bold();

//     // shape to accompany rollover.
//     if (args.data.length > 1 || args.chart_type === 'point') {
//       mouseover_tspan(textContainer, shape + '  ').color(args, d);
//     }
//     // rollover text.
//     mouseover_tspan(textContainer, formatted_x, args.time_series ? 'mg-x-rollover-text' : null);
//     mouseover_tspan(textContainer, formatted_y, args.time_series ? 'mg-y-rollover-text' : null);
//     if (args.chart_type === 'bar' && args.predictor_accessor) mouseover_tspan(textContainer, '   ' + args.predictor_accessor + ': ' + d[args.predictor_accessor], 'mg-bar-predictor-rollover-text')
//     if (args.chart_type === 'bar' && args.baseline_accessor) mouseover_tspan(textContainer, '   ' + args.baseline_accessor + ': ' + d[args.baseline_accessor], 'mg-bar-baseline-rollover-text')
//   }
// }


/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////// New setup for mouseovers ////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////


function mg_clear_mouseover_container (svg) {
  svg.selectAll('.mg-active-datapoint-container').selectAll('*').remove();
}

function mg_setup_mouseover_container (svg, args) {
  svg.select('.mg-active-datapoint').remove();
  var text_anchor = args.mouseover_align === 'right' ? 'end' : (args.mouseover_align === 'left' ? 'start' : 'middle');
  var mouseover_x = args.mouseover_align === 'right' ? mg_get_plot_right(args) : (args.mouseover_align === 'left' ? mg_get_plot_left(args) : (args.width-args.left-args.right) / 2 + args.left);

  var active_datapoint = svg.select('.mg-active-datapoint-container')
    .append('text')
    .attr('class', 'mg-active-datapoint')
    .attr('xml:space', 'preserve')
    .attr('text-anchor', text_anchor);

  // set the rollover text's position; if we have markers on two lines,
  // nudge up the rollover text a bit
  var active_datapoint_y_nudge = 0.75;
  if (args.markers) {
    var yPos;
    svg.selectAll('.mg-marker-text')
      .each(function () {
        if (!yPos) {
          yPos = d3.select(this).attr('y');
        } else if (yPos !== d3.select(this).attr('y')) {
          active_datapoint_y_nudge = 0.56;
        }
      });
  }

  active_datapoint
    .attr('transform', 'translate(' + mouseover_x + ',' + (mg_get_top(args) * active_datapoint_y_nudge) + ')');
}

function mg_mouseover_tspan (svg, text) {

  var tspan = '';
  var cl = null;
  if (arguments.length === 3) cl = arguments[2];
  tspan = svg.append('tspan').text(text);
  if (cl !== null) tspan.classed(cl, true);
  this.tspan = tspan;

  this.bold = function () {
    this.tspan.attr('font-weight', 'bold');
    return this;
  };

  this.font_size = function (pts) {
    this.tspan.attr('font-size', pts);
    return this;
  }

  this.x = function (x) {
    this.tspan.attr('x', x);
    return this;
  };
  this.y = function (y) {
    this.tspan.attr('y', y);
    return this;
  };
  this.elem = function () {
    return this.tspan;
  };
  return this;
}

function mg_reset_text_container (svg) {
  var textContainer = svg.select('.mg-active-datapoint');
  textContainer
    .selectAll('*')
    .remove();
  return textContainer;
}

function mg_mouseover_row(row_number, container, rargs){
  var lineHeight = 1.1;
  this.rargs = rargs;
  var rrr = container.append('tspan').attr('x', 0).attr('y', (row_number * lineHeight) + 'em');
  //this.row.append('tspan').text('hello??');
  this.text = function(text) {
    return mg_mouseover_tspan(rrr, text);
  }
  return this;
}

function mg_mouseover_text(args, rargs) {
  var lineHeight = 1.1;
  this.row_number = 0;
  this.rargs = rargs;
  mg_setup_mouseover_container(rargs.svg, args);

  this.text_container = mg_reset_text_container(rargs.svg);

  this.mouseover_row = function(rargs) {
    var that = this;
    var rrr = mg_mouseover_row(that.row_number, that.text_container, rargs);
    that.row_number +=1;
    return rrr;
  }

  return this;
}



