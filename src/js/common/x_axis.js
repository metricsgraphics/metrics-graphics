function x_rug(args) {
  'use strict';

  if(!args.x_rug) {
    return;
  }

  args.rug_buffer_size = args.chart_type === 'point'
    ? args.buffer / 2
    : args.buffer;

  var rug = mg_make_rug(args, 'mg-x-rug');

  rug.attr('x1', args.scalefns.xf)
    .attr('x2', args.scalefns.xf)
    .attr('y1', args.height - args.bottom - args.rug_buffer_size)
    .attr('y2', args.height - args.bottom);

  mg_add_color_accessor_to_rug(rug, args, 'mg-x-rug-mono');
}

MG.x_rug = x_rug;

function mg_add_processed_object(args) {
  if (!args.processed) {
    args.processed = {};
  }
}

// TODO ought to be deprecated, only used by histogram
function x_axis(args) {
  'use strict';

  var svg = mg_get_svg_child_of(args.target);
  mg_add_processed_object(args);

  mg_select_xax_format(args);
  mg_selectAll_and_remove(svg, '.mg-x-axis');

  if (!args.x_axis) {
    return this;
  }

  var g = mg_add_g(svg, 'mg-x-axis');

  mg_add_x_ticks(g, args);
  mg_add_x_tick_labels(g, args);
  if (args.x_label) { mg_add_x_label(g, args); }
  if (args.x_rug) { x_rug(args); }

  return this;
}

MG.x_axis = x_axis;

function x_axis_categorical(args) {
  var svg = mg_get_svg_child_of(args.target);
  var additional_buffer = 0;
  if (args.chart_type === 'bar') {
    additional_buffer = args.buffer + 5;
  }

  mg_add_categorical_scale(args, 'X', args.categorical_variables.reverse(), args.left, mg_get_plot_right(args) - additional_buffer);
  mg_add_scale_function(args, 'xf', 'X', 'value');
  mg_selectAll_and_remove(svg, '.mg-x-axis');

  var g = mg_add_g(svg, 'mg-x-axis');

  if (!args.x_axis) {
    return this;
  }

  mg_add_x_axis_categorical_labels(g, args, additional_buffer);
  return this;
}

function mg_add_x_axis_categorical_labels(g, args, additional_buffer) {
  var labels = g.selectAll('text')
    .data(args.categorical_variables)
    .enter()
    .append('text');

  labels
    .attr('x', function(d) {
      return args.scales.X(d) + args.scales.X.bandwidth() / 2 + (args.buffer) * args.bar_outer_padding_percentage + (additional_buffer / 2);
    })
    .attr('y', mg_get_plot_bottom(args))
    .attr('dy', '.35em')
    .attr('text-anchor', 'middle')
    .text(String);

  if (args.truncate_x_labels) {
    labels.each(function(d, idx) {
      var elem = this, width = args.scales.X.bandwidth();
      truncate_text(elem, d, width);
    });
  }
  mg_rotate_labels(labels, args.rotate_x_labels);
}

MG.x_axis_categorical = x_axis_categorical;

function mg_point_add_color_scale(args) {
  var color_domain, color_range;

  if (args.color_accessor !== null) {
    color_domain = mg_get_color_domain(args);
    color_range = mg_get_color_range(args);

    if (args.color_type === 'number') {
      args.scales.color = d3.scaleLinear()
        .domain(color_domain)
        .range(color_range)
        .clamp(true);
    } else {
      args.scales.color = args.color_range !== null
        ? d3.scaleOrdinal().range(color_range)
        : (color_domain.length > 10
          ? d3.scaleOrdinal(d3.schemeCategory20)
          : d3.scaleOrdinal(d3.schemeCategory10));

      args.scales.color.domain(color_domain);
    }
    mg_add_scale_function(args, 'color', 'color', args.color_accessor);
  }
}

function mg_get_color_domain(args) {
  var color_domain;
  if (args.color_domain === null) {
    if (args.color_type === 'number') {
      color_domain = d3.extent(args.data[0], function(d) {
        return d[args.color_accessor];
      });
    } else if (args.color_type === 'category') {
      color_domain = d3.set(args.data[0]
          .map(function(d) {
            return d[args.color_accessor];
        }))
        .values();

      color_domain.sort();
    }
  } else {
    color_domain = args.color_domain;
  }
  return color_domain;
}

function mg_get_color_range(args) {
  var color_range;
  if (args.color_range === null) {
    if (args.color_type === 'number') {
      color_range = ['blue', 'red'];
    } else {
      color_range = null;
    }
  } else {
    color_range = args.color_range;
  }
  return color_range;
}

function mg_point_add_size_scale(args) {
  var min_size, max_size, size_domain, size_range;
  if (args.size_accessor !== null) {
    size_domain = mg_get_size_domain(args);
    size_range = mg_get_size_range(args);

    args.scales.size = d3.scaleLinear()
      .domain(size_domain)
      .range(size_range)
      .clamp(true);

    mg_add_scale_function(args, 'size', 'size', args.size_accessor);
  }
}

function mg_get_size_domain(args) {
  return (args.size_domain === null)
    ? d3.extent(args.data[0], function(d) { return d[args.size_accessor]; })
    : args.size_domain;
}

function mg_get_size_range(args) {
  var size_range;
  if (args.size_range === null) {
    size_range = [1, 5];
  } else {
    size_range = args.size_range;
  }
  return size_range;
}

function mg_add_x_label(g, args) {
  if (args.x_label) {
    g.append('text')
      .attr('class', 'label')
      .attr('x', function() {
        return mg_get_plot_left(args) + (mg_get_plot_right(args) - mg_get_plot_left(args)) / 2;
      })
      .attr('dx', args.x_label_nudge_x != null ? args.x_label_nudge_x : 0)
      .attr('y', function() {
        var xAxisTextElement = d3.select(args.target)
          .select('.mg-x-axis text').node().getBoundingClientRect();
        return mg_get_bottom(args) + args.xax_tick_length * (7 / 3) + xAxisTextElement.height * 0.8 + 10;
      })
      .attr('dy', '.5em')
      .attr('text-anchor', 'middle')
      .text(function(d) {
        return args.x_label;
      });
  }
}

function mg_default_bar_xax_format(args) {
  return function(d) {
    if (d < 1.0 && d > -1.0 && d !== 0) {
      // don't scale tiny values
      return args.xax_units + d.toFixed(args.decimals);
    } else {
      var pf = d3.format(',.0f');
      return args.xax_units + pf(d);
    }
  };
}

function mg_get_time_frame(diff) {
  // diff should be (max_x - min_x) / 1000, in other words, the difference in seconds.
  var time_frame;
  if (mg_milisec_diff(diff)) {
    time_frame = 'millis';
  } else if (mg_sec_diff(diff)) {
    time_frame = 'seconds';
  } else if (mg_day_diff(diff)) {
    time_frame = 'less-than-a-day';
  } else if (mg_four_days(diff)) {
    time_frame = 'four-days';
  } else if (mg_many_days(diff)) { // a handful of months?
    time_frame = 'many-days';
  } else if (mg_many_months(diff)) {
    time_frame = 'many-months';
  } else if (mg_years(diff)) {
    time_frame = 'years';
  } else {
    time_frame = 'default';
  }
  return time_frame;
}

function mg_milisec_diff(diff) {
  return diff < 10;
}

function mg_sec_diff(diff) {
  return diff < 60;
}

function mg_day_diff(diff) {
  return diff / (60 * 60) <= 24;
}

function mg_four_days(diff) {
  return diff / (60 * 60) <= 24 * 4;
}

function mg_many_days(diff) {
  return diff / (60 * 60 * 24) <= 93;
}

function mg_many_months(diff) {
  return diff / (60 * 60 * 24) < 365 * 2;
}

function mg_years(diff) {
  return diff / (60 * 60 * 24) >= 365 * 2;
}

function mg_get_time_format(utc, diff) {
  var main_time_format;
  if (mg_milisec_diff(diff)) {
    main_time_format = MG.time_format(utc, '%M:%S.%L');
  } else if (mg_sec_diff(diff)) {
    main_time_format = MG.time_format(utc, '%M:%S');
  } else if (mg_day_diff(diff)) {
    main_time_format = MG.time_format(utc, '%H:%M');
  } else if (mg_four_days(diff)) {
    main_time_format = MG.time_format(utc, '%H:%M');
  } else if (mg_many_days(diff)) {
    main_time_format = MG.time_format(utc, '%b %d');
  } else if (mg_many_months(diff)) {
    main_time_format = MG.time_format(utc, '%b');
  } else {
    main_time_format = MG.time_format(utc, '%Y');
  }
  return main_time_format;
}

function mg_process_time_format(args) {
  var diff;
  var main_time_format;
  var time_frame;

  if (args.time_series) {
    diff = (args.processed.max_x - args.processed.min_x) / 1000;
    time_frame = mg_get_time_frame(diff);
    main_time_format = mg_get_time_format(args.utc_time, diff);
  }

  args.processed.main_x_time_format = main_time_format;
  args.processed.x_time_frame = time_frame;
}

function mg_default_xax_format(args) {
  if (args.xax_format) {
    return args.xax_format;
  }

  var data = args.processed.original_data || args.data;
  var flattened = mg_flatten_array(data)[0];
  var test_point_x = flattened[args.processed.original_x_accessor || args.x_accessor];
  if (test_point_x === undefined) {
    test_point_x = flattened;
  }

  return function(d) {
    mg_process_time_format(args);

    if (mg_is_date(test_point_x)) {
      return args.processed.main_x_time_format(new Date(d));
    } else if (typeof test_point_x === 'number') {
      var is_float = d % 1 !== 0;
      var pf;

      if (is_float) {
        pf = d3.format(',.' + args.decimals + 'f');
      } else if (d < 1000) {
        pf = d3.format(',.0f');
      } else {
        pf = d3.format(',.2s');
      }
      return args.xax_units + pf(d);
    } else {
      return args.xax_units + d;
    }
  };
}

function mg_add_x_ticks(g, args) {
  mg_process_scale_ticks(args, 'x');
  mg_add_x_axis_rim(args, g);
  mg_add_x_axis_tick_lines(args, g);
}

function mg_add_x_axis_rim(args, g) {
  var tick_length = args.processed.x_ticks.length;
  var last_i = args.scales.X.ticks(args.xax_count).length - 1;

  if (!args.x_extended_ticks) {
    g.append('line')
      .attr('x1', function() {
        if (args.xax_count === 0) {
          return mg_get_plot_left(args);
        } else if (args.axes_not_compact && args.chart_type !== 'bar') {
          return args.left;
        } else {
          return (args.scales.X(args.scales.X.ticks(args.xax_count)[0])).toFixed(2);
        }
      })
      .attr('x2', function() {
        if (args.xax_count === 0 || (args.axes_not_compact && args.chart_type !== 'bar')) {
          return mg_get_right(args);
        } else {
          return args.scales.X(args.scales.X.ticks(args.xax_count)[last_i]).toFixed(2);
        }
      })
      .attr('y1', args.height - args.bottom)
      .attr('y2', args.height - args.bottom);
  }
}

function mg_add_x_axis_tick_lines(args, g) {
  g.selectAll('.mg-xax-ticks')
    .data(args.processed.x_ticks).enter()
    .append('line')
    .attr('x1', function(d) {
      return args.scales.X(d).toFixed(2); })
    .attr('x2', function(d) {
      return args.scales.X(d).toFixed(2); })
    .attr('y1', args.height - args.bottom)
    .attr('y2', function() {
      return (args.x_extended_ticks) ? args.top : args.height - args.bottom + args.xax_tick_length;
    })
    .attr('class', function() {
      if (args.x_extended_ticks) {
        return 'mg-extended-xax-ticks';
      }
    })
    .classed('mg-xax-ticks', true);
}

function mg_add_x_tick_labels(g, args) {
  mg_add_primary_x_axis_label(args, g);
  mg_add_secondary_x_axis_label(args, g);
}

function mg_add_primary_x_axis_label(args, g) {
  var labels = g.selectAll('.mg-xax-labels')
    .data(args.processed.x_ticks).enter()
    .append('text')
    .attr('x', function(d) {
      return args.scales.X(d).toFixed(2);
    })
    .attr('y', (args.height - args.bottom + args.xax_tick_length * 7 / 3).toFixed(2))
    .attr('dy', '.50em')
    .attr('text-anchor', 'middle');

  if (args.time_series && args.european_clock) {
    labels.append('tspan').classed('mg-european-hours', true).text(function(_d, i) {
      var d = new Date(_d);
      if (i === 0) return d3.timeFormat('%H')(d);
      else return '';
    });
    labels.append('tspan').classed('mg-european-minutes-seconds', true).text(function(_d, i) {
      var d = new Date(_d);
      return ':' + args.processed.xax_format(d);
    });
  } else {
    labels.text(function(d) {
      return args.xax_units + args.processed.xax_format(d);
    });
  }

  // CHECK TO SEE IF OVERLAP for labels. If so,
  // remove half of them. This is a dirty hack.
  // We will need to figure out a more principled way of doing this.
  if (mg_elements_are_overlapping(labels)) {
    labels.filter(function(d, i) {
      return (i + 1) % 2 === 0;
    }).remove();

    var svg = mg_get_svg_child_of(args.target);
    svg.selectAll('.mg-xax-ticks')
      .filter(function(d, i) {
        return (i + 1) % 2 === 0;
      })
      .remove();
  }
}

function mg_add_secondary_x_axis_label(args, g) {
  if (args.time_series && (args.show_years || args.show_secondary_x_label)) {
    var tf = mg_get_yformat_and_secondary_time_function(args);
    mg_add_secondary_x_axis_elements(args, g, tf.timeframe, tf.yformat, tf.secondary);
  }
}

function mg_get_yformat_and_secondary_time_function(args) {
  var tf = {};
  tf.timeframe = args.processed.x_time_frame;
  switch (tf.timeframe) {
    case 'millis':
    case 'seconds':
      tf.secondary = d3.timeDays;
      if (args.european_clock) tf.yformat = MG.time_format(args.utc_time, '%b %d');
      else tf.yformat = MG.time_format(args.utc_time, '%I %p');
      break;
    case 'less-than-a-day':
      tf.secondary = d3.timeDays;
      tf.yformat = MG.time_format(args.utc_time, '%b %d');
      break;
    case 'four-days':
      tf.secondary = d3.timeDays;
      tf.yformat = MG.time_format(args.utc_time, '%b %d');
      break;
    case 'many-days':
      tf.secondary = d3.timeYears;
      tf.yformat = MG.time_format(args.utc_time, '%Y');
      break;
    case 'many-months':
      tf.secondary = d3.timeYears;
      tf.yformat = MG.time_format(args.utc_time, '%Y');
      break;
    default:
      tf.secondary = d3.timeYears;
      tf.yformat = MG.time_format(args.utc_time, '%Y');
  }
  return tf;
}

function mg_add_secondary_x_axis_elements(args, g, time_frame, yformat, secondary_function) {
  var years = secondary_function(args.processed.min_x, args.processed.max_x);
  if (years.length === 0) {
    var first_tick = args.scales.X.ticks(args.xax_count)[0];
    years = [first_tick];
  }

  var yg = mg_add_g(g, 'mg-year-marker');
  if (time_frame === 'default' && args.show_year_markers) {
    mg_add_year_marker_line(args, yg, years, yformat);
  }
  if (time_frame != 'years') mg_add_year_marker_text(args, yg, years, yformat);
}

function mg_add_year_marker_line(args, g, years, yformat) {
  g.selectAll('.mg-year-marker')
    .data(years).enter()
    .append('line')
    .attr('x1', function(d) {
      return args.scales.X(d).toFixed(2);
    })
    .attr('x2', function(d) {
      return args.scales.X(d).toFixed(2);
    })
    .attr('y1', mg_get_top(args))
    .attr('y2', mg_get_bottom(args));
}

function mg_add_year_marker_text(args, g, years, yformat) {
  g.selectAll('.mg-year-marker')
    .data(years).enter()
    .append('text')
    .attr('x', function(d, i) {
      return args.scales.X(d).toFixed(2);
    })
    .attr('y', function() {
      var xAxisTextElement = d3.select(args.target)
        .select('.mg-x-axis text').node().getBoundingClientRect();
      return (mg_get_bottom(args) + args.xax_tick_length * 7 / 3) + (xAxisTextElement.height * 0.8);
    })
    .attr('dy', '.50em')
    .attr('text-anchor', 'middle')
    .text(function(d) {
      return yformat(new Date(d));
    });
}

function mg_min_max_x_for_nonbars(mx, args, data) {
  var extent_x = d3.extent(data, function(d) {
    return d[args.x_accessor];
  });
  mx.min = extent_x[0];
  mx.max = extent_x[1];
}

function mg_min_max_x_for_bars(mx, args, data) {
  mx.min = d3.min(data, function(d) {
    var trio = [
      d[args.x_accessor],
      (d[args.baseline_accessor]) ? d[args.baseline_accessor] : 0,
      (d[args.predictor_accessor]) ? d[args.predictor_accessor] : 0
    ];
    return Math.min.apply(null, trio);
  });

  if (mx.min > 0) mx.min = 0;

  mx.max = d3.max(data, function(d) {
    var trio = [
      d[args.x_accessor],
      (d[args.baseline_accessor]) ? d[args.baseline_accessor] : 0,
      (d[args.predictor_accessor]) ? d[args.predictor_accessor] : 0
    ];
    return Math.max.apply(null, trio);
  });
  return mx;
}

function mg_min_max_x_for_dates(mx) {
  var yesterday = MG.clone(mx.min).setDate(mx.min.getDate() - 1);
  var tomorrow = MG.clone(mx.min).setDate(mx.min.getDate() + 1);
  mx.min = yesterday;
  mx.max = tomorrow;
}

function mg_min_max_x_for_numbers(mx) {
  // TODO do we want to rewrite this?
  mx.min = mx.min - 1;
  mx.max = mx.max + 1;
}

function mg_min_max_x_for_strings(mx) {
  // TODO shouldn't be allowing strings here to be coerced into numbers
  mx.min = Number(mx.min) - 1;
  mx.max = Number(mx.max) + 1;
}

function mg_force_xax_count_to_be_two(args) {
  args.xax_count = 2;
}

function mg_sort_through_data_type_and_set_x_min_max_accordingly(mx, args, data) {
  if (args.chart_type === 'line' || args.chart_type === 'point' || args.chart_type === 'histogram') {
    mg_min_max_x_for_nonbars(mx, args, data);

  } else if (args.chart_type === 'bar') {
    mg_min_max_x_for_bars(mx, args, data);
  }
  // if data set is of length 1, expand the range so that we can build the x-axis
  if (mx.min === mx.max && !(args.min_x && args.max_x)) {
    if (mg_is_date(mx.min)) {
      mg_min_max_x_for_dates(mx);
    } else if (typeof min_x === 'number') {
      mg_min_max_x_for_numbers(mx);
    } else if (typeof min_x === 'string') {
      mg_min_max_x_for_strings(mx);
    }
    // force xax_count to be 2
    mg_force_xax_count_to_be_two(args);
  }
}

function mg_select_xax_format(args) {
  var c = args.chart_type;
  if (!args.processed.xax_format) {
    if (args.xax_format) {
      args.processed.xax_format = args.xax_format;
    } else {
      if (c === 'line' || c === 'point' || c === 'histogram') {
        args.processed.xax_format = mg_default_xax_format(args);
      } else if (c === 'bar') {
        args.processed.xax_format = mg_default_bar_xax_format(args);
      }
    }
  }
}
