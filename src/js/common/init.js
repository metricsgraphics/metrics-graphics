function mg_merge_args_with_defaults(args) {
  var defaults = {
    target: null,
    title: null,
    description: null
  };

  if (!args) {
    args = {};
  }

  if (!args.processed) {
    args.processed = {};
  }

  args = merge_with_defaults(args, defaults);
  return args;
}

function mg_is_time_series(args) {
  var first_elem = mg_flatten_array(args.processed.original_data || args.data)[0];
  args.time_series = mg_is_date(first_elem[args.processed.original_x_accessor || args.x_accessor]);
}

function mg_init_compute_width(args) {
  var svg_width = args.width;
  if (args.full_width) {
    svg_width = get_width(args.target);
  }
  if (args.x_axis_type === 'categorical' && svg_width === null) {
    svg_width = mg_categorical_calculate_height(args, 'x');
  }

  args.width = svg_width;
}

function mg_init_compute_height(args) {
  var svg_height = args.height;
  if (args.full_height) {
    svg_height = get_height(args.target);
  }
  if (args.y_axis_type === 'categorical' && svg_height === null) {
    svg_height = mg_categorical_calculate_height(args, 'y');
  }

  args.height = svg_height;
}

function mg_remove_svg_if_chart_type_has_changed(svg, args) {
  if ((!svg.selectAll('.mg-main-line').empty() && args.chart_type !== 'line') ||
    (!svg.selectAll('.mg-points').empty() && args.chart_type !== 'point') ||
    (!svg.selectAll('.mg-histogram').empty() && args.chart_type !== 'histogram') ||
    (!svg.selectAll('.mg-barplot').empty() && args.chart_type !== 'bar')
  ) {
    svg.remove();
  }
}

function mg_add_svg_if_it_doesnt_exist(svg, args) {
  if (mg_get_svg_child_of(args.target).empty()) {
    svg = d3.select(args.target)
      .append('svg')
      .classed('linked', args.linked)
      .attr('width', args.width)
      .attr('height', args.height);
  }
  return svg;
}

function mg_add_clip_path_for_plot_area(svg, args) {
  svg.selectAll('.mg-clip-path').remove();
  svg.append('defs')
    .attr('class', 'mg-clip-path')
    .append('clipPath')
    .attr('id', 'mg-plot-window-' + mg_target_ref(args.target))
    .append('svg:rect')
    .attr('x', mg_get_left(args))
    .attr('y', mg_get_top(args))
    .attr('width', args.width - args.left - args.right - args.buffer)
    .attr('height', args.height - args.top - args.bottom - args.buffer + 1);
}

function mg_adjust_width_and_height_if_changed(svg, args) {
  if (args.width !== Number(svg.attr('width'))) {
    svg.attr('width', args.width);
  }
  if (args.height !== Number(svg.attr('height'))) {
    svg.attr('height', args.height);
  }
}

function mg_set_viewbox_for_scaling(svg, args) {
  // we need to reconsider how we handle automatic scaling
  svg.attr('viewBox', '0 0 ' + args.width + ' ' + args.height);
  if (args.full_width || args.full_height) {
    svg.attr('preserveAspectRatio', 'xMinYMin meet');
  }
}

function mg_remove_missing_classes_and_text(svg) {
  // remove missing class
  svg.classed('mg-missing', false);

  // remove missing text
  svg.selectAll('.mg-missing-text').remove();
  svg.selectAll('.mg-missing-pane').remove();
}

function mg_remove_outdated_lines(svg, args) {
  // if we're updating an existing chart and we have fewer lines than
  // before, remove the outdated lines, e.g. if we had 3 lines, and we're calling
  // data_graphic() on the same target with 2 lines, remove the 3rd line

  var i = 0;

  if (svg.selectAll('.mg-main-line').nodes().length >= args.data.length) {
    // now, the thing is we can't just remove, say, line3 if we have a custom
    // line-color map, instead, see which are the lines to be removed, and delete those
    if (args.custom_line_color_map.length > 0) {
      var array_full_series = function(len) {
        var arr = new Array(len);
        for (var i = 0; i < arr.length; i++) { arr[i] = i + 1; }
        return arr;
      };

      // get an array of lines ids to remove
      var lines_to_remove = arr_diff(
        array_full_series(args.max_data_size),
        args.custom_line_color_map);

      for (i = 0; i < lines_to_remove.length; i++) {
        svg.selectAll('.mg-main-line.mg-line' + lines_to_remove[i] + '-color')
          .remove();
      }
    } else {
      // if we don't have a custom line-color map, just remove the lines from the end
      var num_of_new = args.data.length;
      var num_of_existing = (svg.selectAll('.mg-main-line').nodes()) ? svg.selectAll('.mg-main-line').nodes().length : 0;

      for (i = num_of_existing; i > num_of_new; i--) {
        svg.selectAll('.mg-main-line.mg-line' + i + '-color')
          .remove();
      }
    }
  }
}

function mg_raise_container_error(container, args) {
  if (container.empty()) {
    console.warn('The specified target element "' + args.target + '" could not be found in the page. The chart will not be rendered.');
    return;
  }
}

function categoricalInitialization(args, ns) {
  var which = ns === 'x' ? args.width : args.height;
  mg_categorical_count_number_of_groups(args, ns);
  mg_categorical_count_number_of_lanes(args, ns);
  mg_categorical_calculate_group_length(args, ns, which);
  if (which) mg_categorical_calculate_bar_thickness(args, ns);
}


function mg_categorical_count_number_of_groups(args, ns) {
  var accessor_string = ns + 'group_accessor';
  var accessor = args[accessor_string];
  args.categorical_groups = [];
  if (accessor) {
    var data = args.data[0];
    args.categorical_groups = d3.set(data.map(function(d) {
      return d[accessor] })).values();
  }
}

function mg_categorical_count_number_of_lanes(args, ns) {
  var accessor_string = ns + 'group_accessor';
  var groupAccessor = args[accessor_string];

  args.total_bars = args.data[0].length;
  if (groupAccessor) {
    var group_bars = count_array_elements(pluck(args.data[0], groupAccessor));
    group_bars = d3.max(Object.keys(group_bars).map(function(d) {
      return group_bars[d] }));
    args.bars_per_group = group_bars;
  } else {
    args.bars_per_group = args.data[0].length;
  }
}

function mg_categorical_calculate_group_length(args, ns, which) {
  var groupHeight = ns + 'group_height';
  if (which) {
    var gh = ns === 'y' ?
      (args.height - args.top - args.bottom - args.buffer * 2) / (args.categorical_groups.length || 1) :
      (args.width - args.left - args.right - args.buffer * 2) / (args.categorical_groups.length || 1);

    args[groupHeight] = gh;
  } else {
    var step = (1 + args[ns + '_padding_percentage']) * args.bar_thickness;
    args[groupHeight] = args.bars_per_group * step + args[ns + '_outer_padding_percentage'] * 2 * step; //args.bar_thickness + (((args.bars_per_group-1) * args.bar_thickness) * (args.bar_padding_percentage + args.bar_outer_padding_percentage*2));
  }
}

function mg_categorical_calculate_bar_thickness(args, ns) {
  // take one group height.
  var step = (args[ns + 'group_height']) / (args.bars_per_group + args[ns + '_outer_padding_percentage']);
  args.bar_thickness = step - (step * args[ns + '_padding_percentage']);
}

function mg_categorical_calculate_height(args, ns) {
  var groupContribution = (args[ns + 'group_height']) * (args.categorical_groups.length || 1);

  var marginContribution = ns === 'y'
    ? args.top + args.bottom + args.buffer * 2
    : args.left + args.right + args.buffer * 2;

  return groupContribution + marginContribution +
    (args.categorical_groups.length * args[ns + 'group_height'] * (args[ns + 'group_padding_percentage'] + args[ns + 'group_outer_padding_percentage']));
}

function mg_barchart_extrapolate_group_and_thickness_from_height(args) {
  // we need to set args.bar_thickness, group_height
}

function init(args) {
  'use strict';
  args = arguments[0];
  args = mg_merge_args_with_defaults(args);
  // If you pass in a dom element for args.target, the expectation
  // of a string elsewhere will break.
  var container = d3.select(args.target);
  mg_raise_container_error(container, args);

  var svg = container.selectAll('svg');

  // some things that will need to be calculated if we have a categorical axis.
  if (args.y_axis_type === 'categorical') { categoricalInitialization(args, 'y'); }
  if (args.x_axis_type === 'categorical') { categoricalInitialization(args, 'x'); }

  mg_is_time_series(args);
  mg_init_compute_width(args);
  mg_init_compute_height(args);

  mg_remove_svg_if_chart_type_has_changed(svg, args);
  svg = mg_add_svg_if_it_doesnt_exist(svg, args);

  mg_add_clip_path_for_plot_area(svg, args);
  mg_adjust_width_and_height_if_changed(svg, args);
  mg_set_viewbox_for_scaling(svg, args);
  mg_remove_missing_classes_and_text(svg);
  chart_title(args);
  mg_remove_outdated_lines(svg, args);

  return this;
}

MG.init = init;
