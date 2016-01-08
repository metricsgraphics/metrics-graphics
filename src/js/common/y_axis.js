function y_rug (args) {
  'use strict';
  args.rug_buffer_size = args.chart_type === 'point'
    ? args.buffer / 2
    : args.buffer * 2 / 3;

  var rug = mg_make_rug(args, 'mg-y-rug');

  rug.attr('x1', args.left + 1)
    .attr('x2', args.left + args.rug_buffer_size)
    .attr('y1', args.scalefns.yf)
    .attr('y2', args.scalefns.yf);

  mg_add_color_accessor_to_rug(rug, args, 'mg-y-rug-mono');
}

MG.y_rug = y_rug;

function mg_change_y_extents_for_bars (args, my) {
  if (args.chart_type === 'bar') {
    my.min = 0;
    my.max = d3.max(args.data[0], function (d) {
      var trio = [];
      trio.push(d[args.y_accessor]);

      if (args.baseline_accessor !== null) {
        trio.push(d[args.baseline_accessor]);
      }

      if (args.predictor_accessor !== null) {
        trio.push(d[args.predictor_accessor]);
      }

      return Math.max.apply(null, trio);
    });
  }
  return my;
}

function mg_compute_yax_format (args) {
  var yax_format = args.yax_format;
  if (!yax_format) {
    if (args.format === 'count') {
      // increase decimals if we have small values, useful for realtime data
      if (args.processed.max_y < 0.0001) {
        args.decimals = 6;
      } else if (args.processed.max_y < 0.1) {
        args.decimals = 4;
      }

      yax_format = function (f) {
        if (f < 1.0) {
          // Don't scale tiny values.
          return args.yax_units + d3.round(f, args.decimals);
        } else {
          var pf = d3.formatPrefix(f);
          return args.yax_units + pf.scale(f) + pf.symbol;
        }
      };
    } else { // percentage
      yax_format = function (d_) {
        var n = d3.format('2p');
        return n(d_);
      };
    }
  }
  return yax_format;
}

function set_min_max_y (args) {
  // flatten data
  // remove weird data, if log.
  var data = mg_flatten_array(args.data);
  if (args.y_scale_type === 'log') data = data.filter(function (d) { return d[args.y_accessor] > 0; });
  if (args.baselines) { data = data.concat(args.baselines); }

  var extents = d3.extent(data, function (d) { return d[args.y_accessor]; });

  var my = {};
  my.min = extents[0];
  my.max = extents[1];
  // the default case is for the y-axis to start at 0, unless we explicitly want it
  // to start at an arbitrary number or from the data's minimum value
  if (my.min >= 0 && !args.min_y && !args.min_y_from_data) {
    my.min = 0;
  }

  mg_change_y_extents_for_bars(args, my);
  my.min = (args.min_y !== null)
    ? args.min_y
    : my.min;

  my.max = (args.max_y !== null)
    ? args.max_y
    : (my.max < 0)
      ? my.max + (my.max - my.max * args.inflator)
      : my.max * args.inflator;

  if (args.y_scale_type !== 'log' && my.min < 0) {
    my.min = my.min - (my.min - my.min * args.inflator);
  }

  if (!args.min_y && args.min_y_from_data) {
    my.min = my.min / args.inflator;
  }
  args.processed.min_y = my.min;
  args.processed.max_y = my.max;
}

function mg_y_domain_range (args, scale) {
  scale.domain([args.processed.min_y, args.processed.max_y])
    .range([mg_get_plot_bottom(args), args.top]);
  return scale;
}

function mg_define_y_scales (args) {
  var scale = args.y_scale_type === 'log' ? d3.scale.log() : d3.scale.linear();
  if (args.y_scale_type === 'log') {
    if (args.chart_type === 'histogram') {
      // log histogram plots should start just below 1
      // so that bins with single counts are visible
      args.processed.min_y = 0.2;
    } else {
      if (args.processed.min_y <= 0) {
        args.processed.min_y = 1;
      }
    }
  }
  args.scales.Y = mg_y_domain_range(args, scale);
  args.scales.Y.clamp(args.y_scale_type === 'log');

  // used for ticks and such, and designed to be paired with log or linear
  args.scales.Y_axis = mg_y_domain_range(args, d3.scale.linear());
}

function mg_add_y_label (g, args) {
  if (args.y_label) {
    g.append('text')
      .attr('class', 'label')
      .attr('x', function () {
        return -1 * (mg_get_plot_top(args) +
        ((mg_get_plot_bottom(args)) - (mg_get_plot_top(args))) / 2);
      })
      .attr('y', function () {
        return args.left / 2;
      })
      .attr('dy', '0.4em')
      .attr('text-anchor', 'middle')
      .text(function (d) {
        return args.y_label;
      })
      .attr('transform', function (d) {
        return 'rotate(-90)';
      });
  }
}

function mg_process_scale_ticks (args) {
  var scale_ticks = args.scales.Y.ticks(args.yax_count);

  function log10 (val) {
    if (val === 1000) {
      return 3;
    }
    if (val === 1000000) {
      return 7;
    }
    return Math.log(val) / Math.LN10;
  }

  if (args.y_scale_type === 'log') {
    // get out only whole logs
    scale_ticks = scale_ticks.filter(function (d) {
      return Math.abs(log10(d)) % 1 < 1e-6 || Math.abs(log10(d)) % 1 > 1 - 1e-6;
    });
  }

  // filter out fraction ticks if our data is ints and if ymax > number of generated ticks
  var number_of_ticks = args.scales.Y.ticks(args.yax_count).length;

  // is our data object all ints?
  var data_is_int = true;
  args.data.forEach(function (d, i) {
    d.forEach(function (d, i) {
      if (d[args.y_accessor] % 1 !== 0) {
        data_is_int = false;
        return false;
      }
    });
  });

  if (data_is_int && number_of_ticks > args.processed.max_y && args.format === 'count') {
    // remove non-integer ticks
    scale_ticks = scale_ticks.filter(function (d) {
      return d % 1 === 0;
    });
  }
  args.processed.y_ticks = scale_ticks;
}

function mg_add_y_axis_rim (g, args) {
  var tick_length = args.processed.y_ticks.length;
  if (!args.x_extended_ticks && !args.y_extended_ticks && tick_length) {
    var y1scale, y2scale;

    if (args.axes_not_compact && args.chart_type !== 'bar') {
      y1scale = args.height - args.bottom;
      y2scale = args.top;
    } else if (tick_length) {
      y1scale = args.scales.Y(args.processed.y_ticks[0]).toFixed(2);
      y2scale = args.scales.Y(args.processed.y_ticks[tick_length - 1]).toFixed(2);
    } else {
      y1scale = 0;
      y2scale = 0;
    }

    g.append('line')
      .attr('x1', args.left)
      .attr('x2', args.left)
      .attr('y1', y1scale)
      .attr('y2', y2scale);
  }
}

function mg_add_y_axis_tick_lines (g, args) {
  g.selectAll('.mg-yax-ticks')
    .data(args.processed.y_ticks).enter()
    .append('line')
    .classed('mg-extended-y-ticks', args.y_extended_ticks)
    .attr('x1', args.left)
    .attr('x2', function () {
      return (args.y_extended_ticks)
        ? args.width - args.right
        : args.left - args.yax_tick_length;
    })
    .attr('y1', function (d) { return args.scales.Y(d).toFixed(2); })
    .attr('y2', function (d) { return args.scales.Y(d).toFixed(2); });
}

function mg_add_y_axis_tick_labels (g, args) {
  var yax_format = mg_compute_yax_format(args);
  g.selectAll('.mg-yax-labels')
    .data(args.processed.y_ticks).enter()
    .append('text')
    .attr('x', args.left - args.yax_tick_length * 3 / 2)
    .attr('dx', -3)
    .attr('y', function (d) {
      return args.scales.Y(d).toFixed(2);
    })
    .attr('dy', '.35em')
    .attr('text-anchor', 'end')
    .text(function (d) {
      var o = yax_format(d);
      return o;
    });
}

function y_axis (args) {
  if (!args.processed) {
    args.processed = {};
  }

  var svg = mg_get_svg_child_of(args.target);

  set_min_max_y(args);
  MG.call_hook('y_axis.process_min_max', args, args.processed.min_y, args.processed.max_y);

  mg_define_y_scales(args);
  mg_add_scale_function(args, 'yf', 'Y', args.y_accessor);

  mg_selectAll_and_remove(svg, '.mg-y-axis');

  if (!args.y_axis) { return this; }

  var g = mg_add_g(svg, 'mg-y-axis');
  mg_add_y_label(g, args);
  mg_process_scale_ticks(args);
  mg_add_y_axis_rim(g, args);
  mg_add_y_axis_tick_lines(g, args);
  mg_add_y_axis_tick_labels(g, args);

  if (args.y_rug) { y_rug(args); }

  return this;
}

MG.y_axis = y_axis;

function mg_add_categorical_labels (args) {
  var svg = mg_get_svg_child_of(args.target);
  mg_selectAll_and_remove(svg, '.mg-y-axis');
  var g = mg_add_g(svg, 'mg-y-axis');

  var labels = g.selectAll('text').data(args.categorical_variables).enter().append('svg:text')
    .attr('x', args.left)
    .attr('y', function (d) {
      return args.scales.Y(d) + args.scales.Y.rangeBand() / 2 + (args.buffer) * args.outer_padding_percentage;
    })
    .attr('dy', '.35em')
    .attr('text-anchor', 'end')
    .text(String);

  mg_rotate_labels(labels, args.rotate_y_labels);
}

function y_axis_categorical (args) {
  mg_add_categorical_scale(args, 'Y', args.categorical_variables, mg_get_plot_bottom(args), args.top, args.padding_percentage, args.outer_padding_percentage);
  mg_add_scale_function(args, 'yf', 'Y', args.y_accessor);
  if (!args.y_axis) { return this; }
  mg_add_categorical_labels(args);

  return this;
}

MG.y_axis_categorical = y_axis_categorical;
