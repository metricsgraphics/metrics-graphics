function mg_clear_mouseover_container(svg) {
  svg.selectAll('.mg-active-datapoint-container').selectAll('*').remove();
}

function mg_setup_mouseover_container(svg, args) {
  svg.select('.mg-active-datapoint').remove();
  var text_anchor = args.mouseover_align === 'right'
    ? 'end'
    : (args.mouseover_align === 'left'
      ? 'start'
      : 'middle');

  var mouseover_x = (args.mouseover_align === 'right')
    ? mg_get_plot_right(args)
    : (args.mouseover_align === 'left'
      ? mg_get_plot_left(args)
      : (args.width - args.left - args.right) / 2 + args.left);

  var active_datapoint = svg.select('.mg-active-datapoint-container')
    .append('text')
    .attr('class', 'mg-active-datapoint')
    .attr('xml:space', 'preserve')
    .attr('text-anchor', text_anchor);

  // set the rollover text's position; if we have markers on two lines,
  // nudge up the rollover text a bit
  var active_datapoint_y_nudge = 0.75;

  var y_position = (args.x_axis_position === 'bottom')
    ? mg_get_top(args) * active_datapoint_y_nudge
    : mg_get_bottom(args) + args.buffer * 3;

  if (args.markers) {
    var yPos;
    svg.selectAll('.mg-marker-text')
      .each(function() {
        if (!yPos) {
          yPos = d3.select(this).attr('y');
        } else if (yPos !== d3.select(this).attr('y')) {
          active_datapoint_y_nudge = 0.56;
        }
      });
  }

  active_datapoint
    .attr('transform', 'translate(' + mouseover_x + ',' + (y_position) + ')');
}

function mg_mouseover_tspan(svg, text) {
  var tspan = '';
  var cl = null;
  if (arguments.length === 3) cl = arguments[2];
  tspan = svg.append('tspan').text(text);
  if (cl !== null) tspan.classed(cl, true);
  this.tspan = tspan;

  this.bold = function() {
    this.tspan.attr('font-weight', 'bold');
    return this;
  };

  this.font_size = function(pts) {
    this.tspan.attr('font-size', pts);
    return this;
  }

  this.x = function(x) {
    this.tspan.attr('x', x);
    return this;
  };
  this.y = function(y) {
    this.tspan.attr('y', y);
    return this;
  };
  this.elem = function() {
    return this.tspan;
  };
  return this;
}

function mg_reset_text_container(svg) {
  var textContainer = svg.select('.mg-active-datapoint');
  textContainer
    .selectAll('*')
    .remove();
  return textContainer;
}

function mg_mouseover_row(row_number, container, rargs) {
  var lineHeight = 1.1;
  this.rargs = rargs;

  var rrr = container.append('tspan')
    .attr('x', 0)
    .attr('y', (row_number * lineHeight) + 'em');

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
    that.row_number += 1;
    return rrr;
  }

  return this;
}
