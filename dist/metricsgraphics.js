(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.MG = factory());
}(this, (function () { 'use strict';

  //a set of helper functions, some that we've written, others that we've borrowed

  const convert = {
    date: function(data, accessor, time_format) {
      time_format = (typeof time_format === "undefined") ? '%Y-%m-%d' : time_format;
      var parse_time = d3.timeParse(time_format);
      data = data.map(function(d) {
        d[accessor] = parse_time(d[accessor].trim());
        return d;
      });

      return data;
    },
    number: function(data, accessor) {
      data = data.map(function(d) {
        d[accessor] = Number(d[accessor]);
        return d;
      });

      return data;
    }
  };

  function time_format(utc, specifier) {
    return utc ? d3.utcFormat(specifier) : d3.timeFormat(specifier);
  }

  function is_array_of_arrays(data) {
    var all_elements = data.map(function(d) {
      return Array.isArray(d) === true && d.length > 0;
    });

    return d3.sum(all_elements) === data.length;
  }

  function mg_selectAll_and_remove$1(svg, cl) {
    svg.selectAll(cl).remove();
  }

  function mg_infer_type$1(args, ns) {
      // must return categorical or numerical.
      var testPoint = mg_flatten_array$1(args.data);

      testPoint = testPoint[0][args[ns + '_accessor']];
      return typeof testPoint === 'string' ? 'categorical' : 'numerical';
    }

  function mg_get_svg_child_of$1(selector_or_node) {
    return d3.select(selector_or_node).select('svg');
  }

  function mg_flatten_array$1(arr) {
    var flat_data = [];
    return flat_data.concat.apply(flat_data, arr);
  }

  function get_pixel_dimension(target, dimension) {
    return Number(d3.select(target).style(dimension).replace(/px/g, ''));
  }

  function get_width(target) {
    return get_pixel_dimension(target, 'width');
  }

  function get_height(target) {
    return get_pixel_dimension(target, 'height');
  }

  function compare_type(type, value) {
    if (value == null) return true; // allow null or undefined
    if (typeof type === 'string') {
      if (type.substr(-2) === '[]') {
        if (!Array.isArray(value)) return false;
        return value.every(i => compare_type(type.slice(0, -2), i));
      }
      return typeof value === type
        || value === type
        || type.length === 0
        || type === 'array' && Array.isArray(value);
    }
    if (typeof type === 'function') return value === type || value instanceof type;
    return Array.isArray(type) && !!~type.findIndex(i => compare_type(i, value));
  }

  // give us the difference of two int arrays
  // http://radu.cotescu.com/javascript-diff-function/
  function arr_diff$1(a, b) {
    var seen = [],
      diff = [],
      i;
    for (i = 0; i < b.length; i++)
      seen[b[i]] = true;
    for (i = 0; i < a.length; i++)
      if (!seen[a[i]])
        diff.push(a[i]);
    return diff;
  }

  /**
    Truncate a string to fit within an SVG text node
    CSS text-overlow doesn't apply to SVG <= 1.2

    @author Dan de Havilland (github.com/dandehavilland)
    @date 2014-12-02
  */
  function truncate_text(textObj, textString, width) {
    var bbox,
      position = 0;

    textObj.textContent = textString;
    bbox = textObj.getBBox();

    while (bbox.width > width) {
      textObj.textContent = textString.slice(0, --position) + '...';
      bbox = textObj.getBBox();

      if (textObj.textContent === '...') {
        break;
      }
    }
  }

  /**
    Wrap the contents of a text node to a specific width

    Adapted from bl.ocks.org/mbostock/7555321

    @author Mike Bostock
    @author Dan de Havilland
    @date 2015-01-14
  */
  function wrap_text(text, width, token, tspanAttrs) {
    text.each(function() {
      var text = d3.select(this),
        words = text.text().split(token || /\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr("y"),
        dy = 0,
        tspan = text.text(null)
        .append("tspan")
        .attr("x", 0)
        .attr("y", dy + "em")
        .attr(tspanAttrs || {});

      while (!!(word = words.pop())) {
        line.push(word);
        tspan.text(line.join(" "));
        if (width === null || tspan.node().getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = text
            .append("tspan")
            .attr("x", 0)
            .attr("y", ++lineNumber * lineHeight + dy + "em")
            .attr(tspanAttrs || {})
            .text(word);
        }
      }
    });
  }

  function mg_return_label(d) {
    return d.label;
  }

  function mg_remove_existing_markers(svg) {
    svg.selectAll('.mg-markers').remove();
    svg.selectAll('.mg-baselines').remove();
  }

  function mg_in_range(args) {
    return function(d) {
      return (args.scales.X(d[args.x_accessor]) >= mg_get_plot_left(args)) && (args.scales.X(d[args.x_accessor]) <= mg_get_plot_right(args));
    };
  }

  function mg_x_position(args) {
    return function(d) {
      return args.scales.X(d[args.x_accessor]);
    };
  }

  function mg_x_position_fixed(args) {
    var _mg_x_pos = mg_x_position(args);
    return function(d) {
      return _mg_x_pos(d).toFixed(2);
    };
  }

  function mg_y_position_fixed(args) {
    var _mg_y_pos = args.scales.Y;
    return function(d) {
      return _mg_y_pos(d.value).toFixed(2);
    };
  }

  function mg_place_annotations(checker, class_name, args, svg, line_fcn, text_fcn) {
    var g;
    if (checker) {
      g = svg.append('g').attr('class', class_name);
      line_fcn(g, args);
      text_fcn(g, args);
    }
  }

  function mg_place_markers(args, svg) {
    mg_place_annotations(args.markers, 'mg-markers', args, svg, mg_place_marker_lines, mg_place_marker_text);
  }

  function mg_place_baselines(args, svg) {
    mg_place_annotations(args.baselines, 'mg-baselines', args, svg, mg_place_baseline_lines, mg_place_baseline_text);
  }

  function mg_place_marker_lines(gm, args) {
    var x_pos_fixed = mg_x_position_fixed(args);
    gm.selectAll('.mg-markers')
      .data(args.markers.filter(mg_in_range(args)))
      .enter()
      .append('line')
      .attr('x1', x_pos_fixed)
      .attr('x2', x_pos_fixed)
      .attr('y1', args.top)
      .attr('y2', mg_get_plot_bottom(args))
      .attr('class', function(d) {
        return d.lineclass;
      })
      .attr('stroke-dasharray', '3,1');
  }

  function mg_place_marker_text(gm, args) {
    gm.selectAll('.mg-markers')
      .data(args.markers.filter(mg_in_range(args)))
      .enter()
      .append('text')
        .attr('class', function(d) {
          return d.textclass || ''; })
        .classed('mg-marker-text', true)
        .attr('x', mg_x_position(args))
        .attr('y', args.x_axis_position === 'bottom' ? mg_get_top(args) * 0.95 : mg_get_bottom(args) + args.buffer)
        .attr('text-anchor', 'middle')
        .text(mg_return_label)
        .each(function(d) {
          if (d.click) {
            d3.select(this).style('cursor', 'pointer')
              .on('click', d.click);
          }
          if (d.mouseover) {
            d3.select(this).style('cursor', 'pointer')
              .on('mouseover', d.mouseover);
          }
          if (d.mouseout) {
              d3.select(this).style('cursor', 'pointer')
                  .on('mouseout', d.mouseout);
          }
        });

    mg_prevent_horizontal_overlap(gm.selectAll('.mg-marker-text').nodes(), args);
  }

  function mg_place_baseline_lines(gb, args) {
    var y_pos = mg_y_position_fixed(args);
    gb.selectAll('.mg-baselines')
      .data(args.baselines)
      .enter().append('line')
      .attr('x1', mg_get_plot_left(args))
      .attr('x2', mg_get_plot_right(args))
      .attr('y1', y_pos)
      .attr('y2', y_pos);
  }

  function mg_place_baseline_text(gb, args) {
    var y_pos = mg_y_position_fixed(args);
    gb.selectAll('.mg-baselines')
      .data(args.baselines)
      .enter().append('text')
      .attr('x', mg_get_plot_right(args))
      .attr('y', y_pos)
      .attr('dy', -3)
      .attr('text-anchor', 'end')
      .text(mg_return_label);
  }

  function markers$1(args) {

    var svg = mg_get_svg_child_of(args.target);
    mg_remove_existing_markers(svg);
    mg_place_markers(args, svg);
    mg_place_baselines(args, svg);
    return this;
  }

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

  const filter_in_range_data = (args, range) => {
    const is_data_in_range = (data, range) => {
      return data > Math.min(range[0], range[1]) && data < Math.max(range[0], range[1]);
    };
    // if range without this axis return true, else judge is data in range or not.
    return d => ['x', 'y'].every(dim => !(dim in range) || is_data_in_range(d[args[`${dim}_accessor`]], range[dim]));
  };

  // the range here is the range of data
  // range is an object with two optional attributes of x,y, respectively represent ranges on two axes
  const zoom_to_data_domain = (args, range) => {
    const raw_data = args.processed.raw_data || args.data;
    // store raw data and raw domain to in order to zoom back to the initial state
    if (!('raw_data' in args.processed)) {
      args.processed.raw_domain = {
        x: args.scales.X.domain(),
        y: args.scales.Y.domain()
      };
      args.processed.raw_data = raw_data;
    }
    // to avoid drawing outside the chart in the point chart, unnecessary in line chart.
    if (args.chart_type === 'point') {
      if (is_array_of_arrays(raw_data)) {
        args.data = raw_data.map(function(d) {
          return d.filter(filter_in_range_data(args, range));
        });
      } else {
        args.data = raw_data.filter(filter_in_range_data(args, range));
      }
    }
    ['x', 'y'].forEach(dim => {
      if (dim in range) args.processed[`zoom_${dim}`] = range[dim];
      else delete args.processed[`zoom_${dim}`];
    });
    if (args.processed.subplot) {
      if (range !== args.processed.raw_domain) {
        create_brushing_pattern(args.processed.subplot, convert_domain_to_range(args.processed.subplot, range));
      } else {
        remove_brushing_pattern(args.processed.subplot);
      }
    }
    new MG.charts[args.chart_type || defaults.chart_type].descriptor(args);
  };

  const zoom_to_raw_range = args => {
    if (!('raw_domain' in args.processed)) return;
    zoom_to_data_domain(args, args.processed.raw_domain);
    delete args.processed.raw_domain;
    delete args.processed.raw_data;
  };

  // converts the range of selection into the range of data that we can use to
  // zoom the chart to a particular region
  const convert_range_to_domain = (args, range) =>
    ['x', 'y'].reduce((domain, dim) => {
      if (!(dim in range)) return domain;
      domain[dim] = range[dim].map(v => +args.scales[dim.toUpperCase()].invert(v));
      if (dim === 'y') domain[dim].reverse();
      return domain;
    }, {});

  const convert_domain_to_range = (args, domain) =>
    ['x', 'y'].reduce((range, dim) => {
      if (!(dim in domain)) return range;
      range[dim] = domain[dim].map(v => +args.scales[dim.toUpperCase()](v));
      if (dim === 'y') range[dim].reverse();
      return range;
    }, {});

  // the range here is the range of selection
  const zoom_to_data_range = (args, range) => {
    const domain = convert_range_to_domain(args, range);
    zoom_to_data_domain(args, domain);
  };

  function validate_option(options, key, value) {
    if (!Array.isArray(options[key])) return false; // non-existent option
    const typeDef = options[key][1];
    if (!typeDef) return true; // not restricted type
    return compare_type(typeDef, value);
  }

  function options_to_defaults(obj) {
    return Object.keys(obj).reduce((r, k) => {
      r[k] = obj[k][0];
      return r;
    }, {});
  }

  function merge_with_defaults(obj) {
    // code outline taken from underscore
    Array.prototype.slice.call(arguments, 1).forEach(source => {
      if (source) {
        for (var prop in source) {
          if (obj[prop] === void 0) obj[prop] = source[prop];
        }
      }
    });

    return obj;
  }

  /**
    Record of all registered hooks.
    For internal use only.
  */
  let _hooks = {};

  /**
    Execute registered hooks.

    Optional arguments
  */
  function call_hook(name) {
    var hooks = _hooks[name],
      result = [].slice.apply(arguments, [1]),
      processed;

    if (hooks) {
      hooks.forEach(function(hook) {
        if (hook.func) {
          var params = processed || result;

          if (params && params.constructor !== Array) {
            params = [params];
          }

          params = [].concat.apply([], params);
          processed = hook.func.apply(hook.context, params);
        }
      });
    }

    return processed || result;
  }

  function chart_title(args) {

    var svg = mg_get_svg_child_of(args.target);

    //remove the current title if it exists
    svg.select('.mg-header').remove();

    if (args.target && args.title) {
      var chartTitle = svg.insert('text')
        .attr('class', 'mg-header')
        .attr('x', args.center_title_full_width ? args.width /2 : (args.width + args.left - args.right) / 2)
        .attr('y', args.title_y_position)
        .attr('text-anchor', 'middle')
        .attr('dy', '0.55em');

      //show the title
      chartTitle.append('tspan')
        .attr('class', 'mg-chart-title')
        .text(args.title);

      //show and activate the description icon if we have a description
      if (args.show_tooltips && args.description && mg_jquery_exists()) {
        chartTitle.append('tspan')
          .attr('class', 'mg-chart-description')
          .attr('dx', '0.3em')
          .text('\uf059');

        //now that the title is an svg text element, we'll have to trigger
        //mouseenter, mouseleave events manually for the popover to work properly
        var $chartTitle = $(chartTitle.node());
        $chartTitle.popover({
          html: true,
          animation: false,
          placement: 'top',
          content: args.description,
          container: args.target,
          trigger: 'manual',
          template: '<div class="popover mg-popover"><div class="arrow"></div><div class="popover-inner"><h3 class="popover-title"></h3><div class="popover-content"><p></p></div></div></div>'
        }).on('mouseenter', function() {
          d3.selectAll(args.target)
            .selectAll('.mg-popover')
            .remove();

          $(this).popover('show');
          $(d3.select(args.target).select('.popover').node())
            .on('mouseleave', function () {
              $chartTitle.popover('hide');
            });
        }).on('mouseleave', function () {
          setTimeout(function () {
            if (!$('.popover:hover').length) {
              $chartTitle.popover('hide');
            }
          }, 120);
        });
      } else if (args.show_tooltips && args.description && typeof $ === 'undefined') {
        args.error = 'In order to enable tooltips, please make sure you include jQuery.';
      }
    }

    if (args.error) {
      error(args);
    }
  }

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
    var svg_width = parseInt(args.width);
    if (args.full_width) {
      svg_width = get_width(args.target);
    }
    if (args.x_axis_type === 'categorical' && svg_width === null) {
      svg_width = mg_categorical_calculate_height(args, 'x');
    }

    args.width = svg_width;
  }

  function mg_init_compute_height(args) {
    var svg_height = parseInt(args.height);
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

  function selectXaxFormat(args) {
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

  function mg_categorical_count_number_of_groups(args, ns) {
    var accessor_string = ns + 'group_accessor';
    var accessor = args[accessor_string];
    args.categorical_groups = [];
    if (accessor) {
      var data = args.data[0];
      args.categorical_groups = d3.set(data.map(function(d) {
        return d[accessor]; })).values();
    }
  }

  function mg_categorical_count_number_of_lanes(args, ns) {
    var accessor_string = ns + 'group_accessor';
    var groupAccessor = args[accessor_string];

    args.total_bars = args.data[0].length;
    if (groupAccessor) {
      var group_bars = count_array_elements(pluck(args.data[0], groupAccessor));
      group_bars = d3.max(Object.keys(group_bars).map(function(d) {
        return group_bars[d]; }));
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

  function init$1(args) {
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

    selectXaxFormat(args);

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

  function mg_add_scale_function(args, scalefcn_name, scale, accessor, inflation) {
    args.scalefns[scalefcn_name] = function(di) {
      if (inflation === undefined) return args.scales[scale](di[accessor]);
      else return args.scales[scale](di[accessor]) + inflation;
    };
  }

  function mg_position(str, args) {
    if (str === 'bottom' || str === 'top') {
      return [mg_get_plot_left(args), mg_get_plot_right(args)];
    }

    if (str === 'left' || str === 'right') {
      return [mg_get_plot_bottom(args), args.top];
    }
  }

  function scale_factory(args) {
    // big wrapper around d3 scale that automatically formats & calculates scale bounds
    // according to the data, and handles other niceties.
    var scaleArgs = {};
    scaleArgs.use_inflator = false;
    scaleArgs.zero_bottom = false;
    scaleArgs.scaleType = 'numerical';

    this.namespace = function(_namespace) {
      scaleArgs.namespace = _namespace;
      scaleArgs.namespace_accessor_name = scaleArgs.namespace + '_accessor';
      scaleArgs.scale_name = scaleArgs.namespace.toUpperCase();
      scaleArgs.scalefn_name = scaleArgs.namespace + 'f';
      return this;
    };

    this.scaleName = function(scaleName) {
      scaleArgs.scale_name = scaleName.toUpperCase();
      scaleArgs.scalefn_name = scaleName +'f';
      return this;
    };

    this.inflateDomain = function(tf) {
      scaleArgs.use_inflator = tf;
      return this;
    };

    this.zeroBottom = function(tf) {
      scaleArgs.zero_bottom = tf;
      return this;
    };

    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    /// all scale domains are either numerical (number, date, etc.) or categorical (factor, label, etc) /////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    // these functions automatically create the d3 scale function and place the domain.

    this.numericalDomainFromData = function() {
      var other_flat_data_arrays = [];

      if (arguments.length > 0) {
        other_flat_data_arrays = arguments;
      }

      // pull out a non-empty array in args.data.
      var illustrative_data;
      for (var i = 0; i < args.data.length; i++) {
        if (args.data[i].length > 0) {
          illustrative_data = args.data[i];
        }
      }
      scaleArgs.is_time_series = mg_is_date(illustrative_data[0][args[scaleArgs.namespace_accessor_name]])
        ? true
        : false;

      mg_add_scale_function(args, scaleArgs.scalefn_name, scaleArgs.scale_name, args[scaleArgs.namespace_accessor_name]);

      mg_min_max_numerical(args, scaleArgs, other_flat_data_arrays, scaleArgs.use_inflator);

      var time_scale = (args.utc_time)
        ? d3.scaleUtc()
        : d3.scaleTime();

      args.scales[scaleArgs.scale_name] = (scaleArgs.is_time_series)
        ? time_scale
        : (mg_is_function(args[scaleArgs.namespace + '_scale_type']))
          ? args.y_scale_type()
          : (args[scaleArgs.namespace + '_scale_type'] === 'log')
            ? d3.scaleLog()
            : d3.scaleLinear();

      args.scales[scaleArgs.scale_name].domain([args.processed['min_' + scaleArgs.namespace], args.processed['max_' + scaleArgs.namespace]]);
      scaleArgs.scaleType = 'numerical';

      return this;
    };

    this.categoricalDomain = function(domain) {
      args.scales[scaleArgs.scale_name] = d3.scaleOrdinal().domain(domain);
      mg_add_scale_function(args, scaleArgs.scalefn_name, scaleArgs.scale_name, args[scaleArgs.namespace_accessor_name]);
      return this;
    };

    this.categoricalDomainFromData = function() {
      // make args.categorical_variables.
      // lets make the categorical variables.
      var all_data = mg_flatten_array(args.data);
      //d3.set(data.map(function(d){return d[args.group_accessor]})).values()
      scaleArgs.categoricalVariables = d3.set(all_data.map(function(d) {
        return d[args[scaleArgs.namespace_accessor_name]]; })).values();
      args.scales[scaleArgs.scale_name] = d3.scaleBand()
        .domain(scaleArgs.categoricalVariables);

      scaleArgs.scaleType = 'categorical';
      return this;
    };

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////// all scale ranges are either positional (for axes, etc) or arbitrary (colors, size, etc) //////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////

    this.numericalRange = function(range) {
      if (typeof range === 'string') {
        args
          .scales[scaleArgs.scale_name]
          .range(mg_position(range, args));
      } else {
        args
          .scales[scaleArgs.scale_name]
          .range(range);
      }

      return this;
    };

    this.categoricalRangeBands = function(range, halfway) {
      if (halfway === undefined) halfway = false;

      var namespace = scaleArgs.namespace;
      var paddingPercentage = args[namespace + '_padding_percentage'];
      var outerPaddingPercentage = args[namespace + '_outer_padding_percentage'];
      if (typeof range === 'string') {
        // if string, it's a location. Place it accordingly.
        args.scales[scaleArgs.scale_name]
          .range(mg_position(range, args))
          .paddingInner(paddingPercentage)
          .paddingOuter(outerPaddingPercentage);
      } else {
        args.scales[scaleArgs.scale_name]
          .range(range)
          .paddingInner(paddingPercentage)
          .paddingOuter(outerPaddingPercentage);
      }

      mg_add_scale_function(
        args,
        scaleArgs.scalefn_name,
        scaleArgs.scale_name,
        args[scaleArgs.namespace_accessor_name],
        halfway
          ? args.scales[scaleArgs.scale_name].bandwidth() / 2
          : 0
      );

      return this;
    };

    this.categoricalRange = function(range) {
      args.scales[scaleArgs.scale_name].range(range);
      mg_add_scale_function(args, scaleArgs.scalefn_name, scaleArgs.scale_name, args[scaleArgs.namespace_accessor_name]);
      return this;
    };

    this.categoricalColorRange = function() {
      args.scales[scaleArgs.scale_name] = args.scales[scaleArgs.scale_name].domain().length > 10
        ? d3.scaleOrdinal(d3.schemeCategory20)
        : d3.scaleOrdinal(d3.schemeCategory10);

      args
        .scales[scaleArgs.scale_name]
        .domain(scaleArgs.categoricalVariables);

      mg_add_scale_function(args, scaleArgs.scalefn_name, scaleArgs.scale_name, args[scaleArgs.namespace_accessor_name]);
      return this;
    };

    this.clamp = function(yn) {
      args.scales[scaleArgs.scale_name].clamp(yn);
      return this;
    };

    return this;
  }

  /////////////////////////////// x, x_accessor, markers, baselines, etc.
  function mg_min_max_numerical(args, scaleArgs, additional_data_arrays) {
    // A BIT OF EXPLANATION ABOUT THIS FUNCTION
    // This function pulls out all the accessor values in all the arrays in args.data.
    // We also have this additional argument, additional_data_arrays, which is an array of arrays of raw data values.
    // These values also get concatenated to the data pulled from args.data, and the extents are calculate from that.
    // They are optional.
    //
    // This may seem arbitrary, but it gives us a lot of flexibility. For instance, if we're calculating
    // the min and max for the y axis of a line chart, we're going to want to also factor in baselines (horizontal lines
    // that might potentially be outside of the y value bounds). The easiest way to do this is in the line.js code
    // & scale creation to just flatten the args.baselines array, pull out hte values, and feed it in
    // so it appears in additional_data_arrays.
    var namespace = scaleArgs.namespace;
    var namespace_accessor_name = scaleArgs.namespace_accessor_name;
    var use_inflator = scaleArgs.use_inflator;
    var zero_bottom = scaleArgs.zero_bottom;

    var accessor = args[namespace_accessor_name];

    // add together all relevant data arrays.
    var all_data = mg_flatten_array(args.data)
      .map(function(dp) {
        return dp[accessor]; })
      .concat(mg_flatten_array(additional_data_arrays));

    // do processing for log
    if (args[namespace + '_scale_type'] === 'log') {
      all_data = all_data.filter(function(d) {
        return d > 0;
      });
    }

    // use inflator?
    var extents = d3.extent(all_data);
    var min_val = extents[0];
    var max_val = extents[1];

    // bolt scale domain to zero when the right conditions are met:
    // not pulling the bottom of the range from data
    // not zero-bottomed
    // not a time series
    if (zero_bottom && !args['min_' + namespace + '_from_data'] && min_val > 0 && !scaleArgs.is_time_series) {
      min_val = args[namespace + '_scale_type'] === 'log' ? 1 : 0;
    }

    if (args[namespace + '_scale_type'] !== 'log' && min_val < 0 && !scaleArgs.is_time_series) {
      min_val = min_val - (min_val - min_val * args.inflator) * use_inflator;
    }

    if (!scaleArgs.is_time_series) {
      max_val = (max_val < 0) ? max_val + (max_val - max_val * args.inflator) * use_inflator : max_val * (use_inflator ? args.inflator : 1);
    }

    min_val = args['min_' + namespace] != null ? args['min_' + namespace] : min_val;
    max_val = args['max_' + namespace] != null ? args['max_' + namespace] : max_val;
    // if there's a single data point, we should custom-set the max values
    // so we're displaying some kind of range
    if (min_val === max_val && args['min_' + namespace] == null &&
        args['max_' + namespace] == null) {
      if (mg_is_date(min_val)) {
        max_val = new Date(MG.clone(min_val).setDate(min_val.getDate() + 1));
      } else if (typeof min_val === 'number') {
        max_val = min_val + 1;
        mg_force_xax_count_to_be_two(args);
      }
    }

    args.processed['min_' + namespace] = min_val;
    args.processed['max_' + namespace] = max_val;
    if (args.processed['zoom_' + namespace]) {
      args.processed['min_' + namespace] = args.processed['zoom_' + namespace][0];
      args.processed['max_' + namespace] = args.processed['zoom_' + namespace][1];
    }
    MG.call_hook('x_axis.process_min_max', args, args.processed.min_x, args.processed.max_x);
    MG.call_hook('y_axis.process_min_max', args, args.processed.min_y, args.processed.max_y);
  }

  function processScaleTicks (args, axis) {
    var accessor = args[axis + '_accessor'];
    var scale_ticks = args.scales[axis.toUpperCase()].ticks(args[axis + 'ax_count']);
    var max = args.processed['max_' + axis];

    function log10 (val) {
      if (val === 1000) {
        return 3;
      }
      if (val === 1000000) {
        return 7;
      }
      return Math.log(val) / Math.LN10;
    }

    if (args[axis + '_scale_type'] === 'log') {
      // get out only whole logs
      scale_ticks = scale_ticks.filter(function (d) {
        return Math.abs(log10(d)) % 1 < 1e-6 || Math.abs(log10(d)) % 1 > 1 - 1e-6;
      });
    }

    // filter out fraction ticks if our data is ints and if xmax > number of generated ticks
    var number_of_ticks = scale_ticks.length;

    // is our data object all ints?
    var data_is_int = true;
    args.data.forEach(function (d, i) {
      d.forEach(function (d, i) {
        if (d[accessor] % 1 !== 0) {
          data_is_int = false;
          return false;
        }
      });
    });

    if (data_is_int && number_of_ticks > max && args.format === 'count') {
      // remove non-integer ticks
      scale_ticks = scale_ticks.filter(function (d) {
        return d % 1 === 0;
      });
    }

    args.processed[axis + '_ticks'] = scale_ticks;
  }

  function rugPlacement (args, axisArgs) {
    var position = axisArgs.position;
    var ns = axisArgs.namespace;
    var coordinates = {};
    if (position === 'left') {
      coordinates.x1 = mg_get_left(args) + 1;
      coordinates.x2 = mg_get_left(args) + args.rug_buffer_size;
      coordinates.y1 = args.scalefns[ns + 'f'];
      coordinates.y2 = args.scalefns[ns + 'f'];
    }
    if (position === 'right') {
      coordinates.x1 = mg_get_right(args) - 1;
      coordinates.x2 = mg_get_right(args) - args.rug_buffer_size;
      coordinates.y1 = args.scalefns[ns + 'f'];
      coordinates.y2 = args.scalefns[ns + 'f'];
    }
    if (position === 'top') {
      coordinates.x1 = args.scalefns[ns + 'f'];
      coordinates.x2 = args.scalefns[ns + 'f'];
      coordinates.y1 = mg_get_top(args) + 1;
      coordinates.y2 = mg_get_top(args) + args.rug_buffer_size;
    }
    if (position === 'bottom') {
      coordinates.x1 = args.scalefns[ns + 'f'];
      coordinates.x2 = args.scalefns[ns + 'f'];
      coordinates.y1 = mg_get_bottom(args) - 1;
      coordinates.y2 = mg_get_bottom(args) - args.rug_buffer_size;
    }
    return coordinates;
  }

  function rimPlacement (args, axisArgs) {
    var ns = axisArgs.namespace;
    var position = axisArgs.position;
    var tick_length = args.processed[ns + '_ticks'].length;
    var ticks = args.processed[ns + '_ticks'];
    var scale = args.scales[ns.toUpperCase()];
    var coordinates = {};

    if (position === 'left') {
      coordinates.x1 = mg_get_left(args);
      coordinates.x2 = mg_get_left(args);
      coordinates.y1 = scale(ticks[0]).toFixed(2);
      coordinates.y2 = scale(ticks[tick_length - 1]).toFixed(2);
    }
    if (position === 'right') {
      coordinates.x1 = mg_get_right(args);
      coordinates.x2 = mg_get_right(args);
      coordinates.y1 = scale(ticks[0]).toFixed(2);
      coordinates.y2 = scale(ticks[tick_length - 1]).toFixed(2);
    }
    if (position === 'top') {
      coordinates.x1 = mg_get_left(args);
      coordinates.x2 = mg_get_right(args);
      coordinates.y1 = mg_get_top(args);
      coordinates.y2 = mg_get_top(args);
    }
    if (position === 'bottom') {
      coordinates.x1 = mg_get_left(args);
      coordinates.x2 = mg_get_right(args);
      coordinates.y1 = mg_get_bottom(args);
      coordinates.y2 = mg_get_bottom(args);
    }

    if (position === 'left' || position === 'right') {
      if (args.axes_not_compact) {
        coordinates.y1 = mg_get_bottom(args);
        coordinates.y2 = mg_get_top(args);
      } else if (tick_length) {
        coordinates.y1 = scale(ticks[0]).toFixed(2);
        coordinates.y2 = scale(ticks[tick_length - 1]).toFixed(2);
      }
    }

    return coordinates;
  }

  function labelPlacement (args, axisArgs) {
    var position = axisArgs.position;
    var ns = axisArgs.namespace;
    var tickLength = args[ns + 'ax_tick_length'];
    var scale = args.scales[ns.toUpperCase()];
    var coordinates = {};

    if (position === 'left') {
      coordinates.x = mg_get_left(args) - tickLength * 3 / 2;
      coordinates.y = function (d) {
        return scale(d).toFixed(2);
      };
      coordinates.dx = -3;
      coordinates.dy = '.35em';
      coordinates.textAnchor = 'end';
      coordinates.text = function (d) {
        return mg_compute_yax_format(args)(d);
      };
    }
    if (position === 'right') {
      coordinates.x = mg_get_right(args) + tickLength * 3 / 2;
      coordinates.y = function (d) {
        return scale(d).toFixed(2);
      };
      coordinates.dx = 3;
      coordinates.dy = '.35em';
      coordinates.textAnchor = 'start';
      coordinates.text = function (d) {
        return mg_compute_yax_format(args)(d); };
    }
    if (position === 'top') {
      coordinates.x = function (d) {
        return scale(d).toFixed(2);
      };
      coordinates.y = (mg_get_top(args) - tickLength * 7 / 3).toFixed(2);
      coordinates.dx = 0;
      coordinates.dy = '0em';
      coordinates.textAnchor = 'middle';
      coordinates.text = function (d) {
        return mg_default_xax_format(args)(d);
      };
    }
    if (position === 'bottom') {
      coordinates.x = function (d) {
        return scale(d).toFixed(2);
      };
      coordinates.y = (mg_get_bottom(args) + tickLength * 7 / 3).toFixed(2);
      coordinates.dx = 0;
      coordinates.dy = '.50em';
      coordinates.textAnchor = 'middle';
      coordinates.text = function (d) {
        return mg_default_xax_format(args)(d);
      };
    }

    return coordinates;
  }

  function addSecondaryLabelElements (args, axisArgs, g) {
    var tf = mg_get_yformat_and_secondary_time_function(args);
    var years = tf.secondary(args.processed.min_x, args.processed.max_x);
    if (years.length === 0) {
      var first_tick = args.scales.X.ticks(args.xax_count)[0];
      years = [first_tick];
    }

    var yg = mg_add_g(g, 'mg-year-marker');
    if (tf.timeframe === 'default' && args.show_year_markers) {
      yearMarkerLine(args, axisArgs, yg, years, tf.yformat);
    }
    if (tf.tick_diff_timeframe != 'years') yearMarkerText(args, axisArgs, yg, years, tf.yformat);
  }

  function yearMarkerLine (args, axisArgs, g, years, yformat) {
    g.selectAll('.mg-year-marker')
      .data(years).enter()
      .append('line')
      .attr('x1', function (d) {
        return args.scales.X(d).toFixed(2); })
      .attr('x2', function (d) {
        return args.scales.X(d).toFixed(2); })
      .attr('y1', mg_get_top(args))
      .attr('y2', mg_get_bottom(args));
  }

  function yearMarkerText (args, axisArgs, g, years, yformat) {
    var position = axisArgs.position;
    var ns = axisArgs.namespace;
    var scale = args.scales[ns.toUpperCase()];
    var x, y, dy, textAnchor, textFcn;
    var xAxisTextElement = d3.select(args.target)
      .select('.mg-x-axis text').node().getBoundingClientRect();

    if (position === 'top') {
      x = function (d, i) {
        return scale(d).toFixed(2); };
      y = (mg_get_top(args) - args.xax_tick_length * 7 / 3) - (xAxisTextElement.height);
      dy = '.50em';
      textAnchor = 'middle';
      textFcn = function (d) {
        return yformat(new Date(d)); };
    }
    if (position === 'bottom') {
      x = function (d, i) {
        return scale(d).toFixed(2); };
      y = (mg_get_bottom(args) + args.xax_tick_length * 7 / 3) + (xAxisTextElement.height * 0.8);
      dy = '.50em';
      textAnchor = 'middle';
      textFcn = function (d) {
        return yformat(new Date(d)); };
    }

    g.selectAll('.mg-year-marker')
      .data(years).enter()
      .append('text')
      .attr('x', x)
      .attr('y', y)
      .attr('dy', dy)
      .attr('text-anchor', textAnchor)
      .text(textFcn);
  }

  function addNumericalLabels (g, args, axisArgs) {
    var ns = axisArgs.namespace;
    var coords = labelPlacement(args, axisArgs);
    var ticks = args.processed[ns + '_ticks'];

    var labels = g.selectAll('.mg-yax-labels')
      .data(ticks).enter()
      .append('text')
      .attr('x', coords.x)
      .attr('dx', coords.dx)
      .attr('y', coords.y)
      .attr('dy', coords.dy)
      .attr('text-anchor', coords.textAnchor)
      .text(coords.text);
    // move the labels if they overlap
    if (ns == 'x') {
      if (args.time_series && args.european_clock) {
        labels.append('tspan').classed('mg-european-hours', true).text(function (_d, i) {
          var d = new Date(_d);
          if (i === 0) return d3.timeFormat('%H')(d);
          else return '';
        });
        labels.append('tspan').classed('mg-european-minutes-seconds', true).text(function (_d, i) {
          var d = new Date(_d);
          return ':' + args.processed.xax_format(d);
        });
      } else {
        labels.text(function (d) {
          return args.xax_units + args.processed.xax_format(d);
        });
      }

      if (args.time_series && (args.show_years || args.show_secondary_x_label)) {
        addSecondaryLabelElements(args, axisArgs, g);
      }
    }

    if (mg_elements_are_overlapping(labels)) {
      labels.filter(function (d, i) {
        return (i + 1) % 2 === 0;
      }).remove();

      var svg = mg_get_svg_child_of(args.target);
      svg.selectAll('.mg-' + ns + 'ax-ticks').filter(function (d, i) {
        return (i + 1) % 2 === 0; })
        .remove();
    }
  }

  function addTickLines (g, args, axisArgs) {
    // name
    var ns = axisArgs.namespace;
    var position = axisArgs.position;
    var scale = args.scales[ns.toUpperCase()];

    var ticks = args.processed[ns + '_ticks'];
    var ticksClass = 'mg-' + ns + 'ax-ticks';
    var extendedTicksClass = 'mg-extended-' + ns + 'ax-ticks';
    var extendedTicks = args[ns + '_extended_ticks'];
    var tickLength = args[ns + 'ax_tick_length'];

    var x1, x2, y1, y2;

    if (position === 'left') {
      x1 = mg_get_left(args);
      x2 = extendedTicks ? mg_get_right(args) : mg_get_left(args) - tickLength;
      y1 = function (d) {
        return scale(d).toFixed(2);
      };
      y2 = function (d) {
        return scale(d).toFixed(2);
      };
    }
    if (position === 'right') {
      x1 = mg_get_right(args);
      x2 = extendedTicks ? mg_get_left(args) : mg_get_right(args) + tickLength;
      y1 = function (d) {
        return scale(d).toFixed(2);
      };
      y2 = function (d) {
        return scale(d).toFixed(2);
      };
    }
    if (position === 'top') {
      x1 = function (d) {
        return scale(d).toFixed(2);
      };
      x2 = function (d) {
        return scale(d).toFixed(2);
      };
      y1 = mg_get_top(args);
      y2 = extendedTicks ? mg_get_bottom(args) : mg_get_top(args) - tickLength;
    }
    if (position === 'bottom') {
      x1 = function (d) {
        return scale(d).toFixed(2);
      };
      x2 = function (d) {
        return scale(d).toFixed(2);
      };
      y1 = mg_get_bottom(args);
      y2 = extendedTicks ? mg_get_top(args) : mg_get_bottom(args) + tickLength;
    }

    g.selectAll('.' + ticksClass)
      .data(ticks).enter()
      .append('line')
      .classed(extendedTicksClass, extendedTicks)
      .attr('x1', x1)
      .attr('x2', x2)
      .attr('y1', y1)
      .attr('y2', y2);
  }

  function initializeAxisRim (g, args, axisArgs) {
    var namespace = axisArgs.namespace;
    var tick_length = args.processed[namespace + '_ticks'].length;

    var rim = rimPlacement(args, axisArgs);

    if (!args[namespace + '_extended_ticks'] && !args[namespace + '_extended_ticks'] && tick_length) {
      g.append('line')
        .attr('x1', rim.x1)
        .attr('x2', rim.x2)
        .attr('y1', rim.y1)
        .attr('y2', rim.y2);
    }
  }

  function initializeRug (args, rug_class) {
    var svg = mg_get_svg_child_of(args.target);
    var all_data = mg_flatten_array(args.data);
    var rug = svg.selectAll('line.' + rug_class).data(all_data);

    // set the attributes that do not change after initialization, per
    rug.enter().append('svg:line').attr('class', rug_class).attr('opacity', 0.3);

    // remove rug elements that are no longer in use
    mg_exit_and_remove(rug);

    // set coordinates of new rug elements
    mg_exit_and_remove(rug);
    return rug;
  }

  function rug (args, axisArgs) {
    args.rug_buffer_size = args.chart_type === 'point' ? args.buffer / 2 : args.buffer * 2 / 3;

    var rug = initializeRug(args, 'mg-' + axisArgs.namespace + '-rug');
    var rug_positions = rugPlacement(args, axisArgs);
    rug.attr('x1', rug_positions.x1)
      .attr('x2', rug_positions.x2)
      .attr('y1', rug_positions.y1)
      .attr('y2', rug_positions.y2);

    mg_add_color_accessor_to_rug(rug, args, 'mg-' + axisArgs.namespace + '-rug-mono');
  }

  function categoricalLabelPlacement (args, axisArgs, group) {
    var ns = axisArgs.namespace;
    var position = axisArgs.position;
    var scale = args.scales[ns.toUpperCase()];
    var groupScale = args.scales[(ns + 'group').toUpperCase()];
    var coords = {};
    coords.cat = {};
    coords.group = {};
    // x, y, dy, text-anchor

    if (position === 'left') {
      coords.cat.x = mg_get_plot_left(args) - args.buffer;
      coords.cat.y = function (d) {
        return groupScale(group) + scale(d) + scale.bandwidth() / 2;
      };
      coords.cat.dy = '.35em';
      coords.cat.textAnchor = 'end';
      coords.group.x = mg_get_plot_left(args) - args.buffer;
      coords.group.y = groupScale(group) + (groupScale.bandwidth ? groupScale.bandwidth() / 2 : 0);
      coords.group.dy = '.35em';
      coords.group.textAnchor = args['rotate_' + ns + '_labels'] ? 'end' : 'end';
    }

    if (position === 'right') {
      coords.cat.x = mg_get_plot_right(args) - args.buffer;
      coords.cat.y = function (d) {
        return groupScale(group) + scale(d) + scale.bandwidth() / 2;
      };
      coords.cat.dy = '.35em';
      coords.cat.textAnchor = 'start';
      coords.group.x = mg_get_plot_right(args) - args.buffer;
      coords.group.y = groupScale(group) + (groupScale.bandwidth ? groupScale.bandwidth() / 2 : 0);
      coords.group.dy = '.35em';
      coords.group.textAnchor = 'start';
    }

    if (position === 'top') {
      coords.cat.x = function (d) {
        return groupScale(group) + scale(d) + scale.bandwidth() / 2;
      };
      coords.cat.y = mg_get_plot_top(args) + args.buffer;
      coords.cat.dy = '.35em';
      coords.cat.textAnchor = args['rotate_' + ns + '_labels'] ? 'start' : 'middle';
      coords.group.x = groupScale(group) + (groupScale.bandwidth ? groupScale.bandwidth() / 2 : 0);
      coords.group.y = mg_get_plot_top(args) + args.buffer;
      coords.group.dy = '.35em';
      coords.group.textAnchor = args['rotate_' + ns + '_labels'] ? 'start' : 'middle';
    }

    if (position === 'bottom') {
      coords.cat.x = function (d) {
        return groupScale(group) + scale(d) + scale.bandwidth() / 2;
      };
      coords.cat.y = mg_get_plot_bottom(args) + args.buffer;
      coords.cat.dy = '.35em';
      coords.cat.textAnchor = args['rotate_' + ns + '_labels'] ? 'start' : 'middle';
      coords.group.x = groupScale(group) + (groupScale.bandwidth ? groupScale.bandwidth() / 2 - scale.bandwidth() / 2 : 0);
      coords.group.y = mg_get_plot_bottom(args) + args.buffer;
      coords.group.dy = '.35em';
      coords.group.textAnchor = args['rotate_' + ns + '_labels'] ? 'start' : 'middle';
    }

    return coords;
  }

  function categoricalLabels (args, axisArgs) {
    var ns = axisArgs.namespace;
    var nsClass = 'mg-' + ns + '-axis';
    var scale = args.scales[ns.toUpperCase()];
    var groupScale = args.scales[(ns + 'group').toUpperCase()];
    var groupAccessor = ns + 'group_accessor';

    var svg = mg_get_svg_child_of(args.target);
    mg_selectAll_and_remove(svg, '.' + nsClass);
    var g = mg_add_g(svg, nsClass);
    var group_g;
    var groups = groupScale.domain && groupScale.domain()
      ? groupScale.domain()
      : ['1'];

    groups.forEach(function (group) {
      // grab group placement stuff.
      var coords = categoricalLabelPlacement(args, axisArgs, group);

      var labels;
      group_g = mg_add_g(g, 'mg-group-' + mg_normalize(group));
      if (args[groupAccessor] !== null) {
        labels = group_g.append('text')
          .classed('mg-barplot-group-label', true)
          .attr('x', coords.group.x)
          .attr('y', coords.group.y)
          .attr('dy', coords.group.dy)
          .attr('text-anchor', coords.group.textAnchor)
          .text(group);

      } else {
        labels = group_g.selectAll('text')
          .data(scale.domain())
          .enter()
          .append('text')
          .attr('x', coords.cat.x)
          .attr('y', coords.cat.y)
          .attr('dy', coords.cat.dy)
          .attr('text-anchor', coords.cat.textAnchor)
          .text(String);
      }
      if (args['rotate_' + ns + '_labels']) {
        rotateLabels(labels, args['rotate_' + ns + '_labels']);
      }
    });
  }

  function categoricalGuides (args, axisArgs) {
    // for each group
    // for each data point

    var ns = axisArgs.namespace;
    var scalef = args.scalefns[ns + 'f'];
    var groupf = args.scalefns[ns + 'groupf'];
    var groupScale = args.scales[(ns + 'group').toUpperCase()];
    var scale = args.scales[ns.toUpperCase()];
    var position = axisArgs.position;

    var svg = mg_get_svg_child_of(args.target);

    var x1, x2, y1, y2;
    var grs = (groupScale.domain && groupScale.domain()) ? groupScale.domain() : [null];

    mg_selectAll_and_remove(svg, '.mg-category-guides');
    var g = mg_add_g(svg, 'mg-category-guides');

    grs.forEach(function (group) {
      scale.domain().forEach(function (cat) {
        if (position === 'left' || position === 'right') {
          x1 = mg_get_plot_left(args);
          x2 = mg_get_plot_right(args);
          y1 = scale(cat) + groupScale(group) + scale.bandwidth() / 2;
          y2 = scale(cat) + groupScale(group) + scale.bandwidth() / 2;
        }

        if (position === 'top' || position === 'bottom') {
          x1 = scale(cat) + groupScale(group) + scale.bandwidth() / 2 * (group === null);
          x2 = scale(cat) + groupScale(group) + scale.bandwidth() / 2 * (group === null);
          y1 = mg_get_plot_bottom(args);
          y2 = mg_get_plot_top(args);
        }

        g.append('line')
          .attr('x1', x1)
          .attr('x2', x2)
          .attr('y1', y1)
          .attr('y2', y2)
          .attr('stroke-dasharray', '2,1');
      });

      var first = groupScale(group) + scale(scale.domain()[0]) + scale.bandwidth() / 2 * (group === null || (position !== 'top' && position != 'bottom'));
      var last = groupScale(group) + scale(scale.domain()[scale.domain().length - 1]) + scale.bandwidth() / 2 * (group === null || (position !== 'top' && position != 'bottom'));

      var x11, x21, y11, y21, x12, x22, y12, y22;
      if (position === 'left' || position === 'right') {
        x11 = mg_get_plot_left(args);
        x21 = mg_get_plot_left(args);
        y11 = first;
        y21 = last;

        x12 = mg_get_plot_right(args);
        x22 = mg_get_plot_right(args);
        y12 = first;
        y22 = last;
      }

      if (position === 'bottom' || position === 'top') {
        x11 = first;
        x21 = last;
        y11 = mg_get_plot_bottom(args);
        y21 = mg_get_plot_bottom(args);

        x12 = first;
        x22 = last;
        y12 = mg_get_plot_top(args);
        y22 = mg_get_plot_top(args);
      }

      g.append('line')
        .attr('x1', x11)
        .attr('x2', x21)
        .attr('y1', y11)
        .attr('y2', y21)
        .attr('stroke-dasharray', '2,1');

      g.append('line')
        .attr('x1', x12)
        .attr('x2', x22)
        .attr('y1', y12)
        .attr('y2', y22)
        .attr('stroke-dasharray', '2,1');
    });
  }

  function rotateLabels (labels, rotation_degree) {
    if (rotation_degree) {
      labels.attr('transform', function () {
        var elem = d3.select(this);
        return 'rotate(' + rotation_degree + ' ' + elem.attr('x') + ',' + elem.attr('y') + ')';
      });

    }
  }

  var mgDrawAxis = {};

  mgDrawAxis.categorical = function (args, axisArgs) {
    var ns = axisArgs.namespace;

    categoricalLabels(args, axisArgs);
    categoricalGuides(args, axisArgs);
  };

  mgDrawAxis.numerical = function (args, axisArgs) {
    var namespace = axisArgs.namespace;
    var axisName = namespace + '_axis';
    var axisClass = 'mg-' + namespace + '-axis';
    var svg = mg_get_svg_child_of(args.target);

    mg_selectAll_and_remove(svg, '.' + axisClass);

    if (!args[axisName]) {
      return this;
    }

    var g = mg_add_g(svg, axisClass);

    processScaleTicks(args, namespace);
    initializeAxisRim(g, args, axisArgs);
    addTickLines(g, args, axisArgs);
    addNumericalLabels(g, args, axisArgs);

    // add label
    if (args[namespace + '_label']) {
      axisArgs.label(svg.select('.mg-' + namespace + '-axis'), args);
    }

    // add rugs
    if (args[namespace + '_rug']) {
      rug(args, axisArgs);
    }

    if (args.show_bar_zero) {
      mg_bar_add_zero_line(args);
    }

    return this;
  };

  function axis_factory(args) {
    var axisArgs = {};
    axisArgs.type = 'numerical';

    this.namespace = function (ns) {
      // take the ns in the scale, and use it to
      axisArgs.namespace = ns;
      return this;
    };

    this.rug = function (tf) {
      axisArgs.rug = tf;
      return this;
    };

    this.label = function (tf) {
      axisArgs.label = tf;
      return this;
    };

    this.type = function (t) {
      axisArgs.type = t;
      return this;
    };

    this.position = function (pos) {
      axisArgs.position = pos;
      return this;
    };

    this.zeroLine = function (tf) {
      axisArgs.zeroLine = tf;
      return this;
    };

    this.draw = function () {
      mgDrawAxis[axisArgs.type](args, axisArgs);
      return this;
    };

    return this;

  }

  function mg_compute_yax_format (args) {
    var yax_format = args.yax_format;
    if (!yax_format) {
      let decimals = args.decimals;
      if (args.format === 'count') {
        // increase decimals if we have small values, useful for realtime data
        if (args.processed.y_ticks.length > 1) {
          // calculate the number of decimals between the difference of ticks
          // based on approach in flot: https://github.com/flot/flot/blob/958e5fd43c6dff4bab3e1fd5cb6109df5c1e8003/jquery.flot.js#L1810
          decimals = Math.max(0, -Math.floor(
            Math.log(Math.abs(args.processed.y_ticks[1] - args.processed.y_ticks[0])) / Math.LN10
          ));
        }

        yax_format = function (d) {
          var pf;

          if (decimals !== 0) {
            // don't scale tiny values
            pf = d3.format(',.' + decimals + 'f');
          } else if (d < 1000) {
            pf = d3.format(',.0f');
          } else {
            pf = d3.format(',.2s');
          }

          // are we adding units after the value or before?
          if (args.yax_units_append) {
            return pf(d) + args.yax_units;
          } else {
            return args.yax_units + pf(d);
          }
        };
      } else { // percentage
        yax_format = function (d_) {
          var n = d3.format('.0%');
          return n(d_);
        };
      }
    }
    return yax_format;
  }

  function mg_bar_add_zero_line (args) {
    var svg = mg_get_svg_child_of(args.target);
    var extents = args.scales.X.domain();
    if (0 >= extents[0] && extents[1] >= 0) {
      var r = args.scales.Y.range();
      var g = args.categorical_groups.length
        ? args.scales.YGROUP(args.categorical_groups[args.categorical_groups.length - 1])
        : args.scales.YGROUP();

      svg.append('svg:line')
        .attr('x1', args.scales.X(0))
        .attr('x2', args.scales.X(0))
        .attr('y1', r[0] + mg_get_plot_top(args))
        .attr('y2', r[r.length - 1] + g)
        .attr('stroke', 'black')
        .attr('opacity', 0.2);
    }
  }

  // barchart re-write.
  function mg_targeted_legend({legend_target, orientation, scales}) {
    let labels;
    if (legend_target) {

      const div = d3.select(legend_target).append('div').classed('mg-bar-target-legend', true);

      if (orientation == 'horizontal') labels = scales.Y.domain();
      else labels = scales.X.domain();

      labels.forEach(label => {
        const outer_span = div.append('span').classed('mg-bar-target-element', true);
        outer_span.append('span')
          .classed('mg-bar-target-legend-shape', true)
          .style('color', scales.COLOR(label))
          .text('\u25FC ');
        outer_span.append('span')
          .classed('mg-bar-target-legend-text', true)
          .text(label);
      });
    }
  }

  function legend_on_graph(svg, args) {
    // draw each element at the top right
    // get labels

    let labels;
    if (args.orientation=='horizontal') labels = args.scales.Y.domain();
    else labels = args.scales.X.domain();

    let lineCount = 0;
    const lineHeight = 1.1;
    const g = svg.append('g').classed("mg-bar-legend", true);
    const textContainer = g.append('text');

    textContainer
      .selectAll('*')
      .remove();
    textContainer
      .attr('width', args.right)
      .attr('height', 100)
      .attr('text-anchor', 'start');

    labels.forEach(label => {
      const sub_container = textContainer.append('tspan')
        .attr('x', mg_get_plot_right(args))
        .attr('y', args.height / 2)
        .attr('dy', `${lineCount * lineHeight}em`);
      sub_container.append('tspan')
        .text('\u25a0 ')
        .attr('fill', args.scales.COLOR(label))
        .attr('font-size', 20);
      sub_container.append('tspan')
        .text(label)
        .attr('font-weight', 300)
        .attr('font-size', 10);
      lineCount++;
    });

    // d.values.forEach(function (datum) {
    //   formatted_y = mg_format_y_rollover(args, num, datum);

    //   if (args.y_rollover_format !== null) {
    //     formatted_y = number_rollover_format(args.y_rollover_format, datum, args.y_accessor);
    //   } else {
    //     formatted_y = args.yax_units + num(datum[args.y_accessor]);
    //   }

    //   sub_container = textContainer.append('tspan').attr('x', 0).attr('y', (lineCount * lineHeight) + 'em');
    //   formatted_y = mg_format_y_rollover(args, num, datum);
    //   mouseover_tspan(sub_container, '\u2014  ')
    //     .color(args, datum);
    //   mouseover_tspan(sub_container, formatted_x + ' ' + formatted_y);

    //   lineCount++;
    // });
  }

  function barChart(args) {
    this.args = args;

    this.init = (args) => {
      this.args = args;
      args.x_axis_type = mg_infer_type$1(args, 'x');
      args.y_axis_type = mg_infer_type$1(args, 'y');

      // this is specific to how rects work in svg, let's keep track of the bar orientation to
      // plot appropriately.
      if (args.x_axis_type == 'categorical') {
        args.orientation = 'vertical';
      } else if (args.y_axis_type == 'categorical') {
        args.orientation = 'horizontal';
      } else if (args.x_axis_type != 'categorical' && args.y_axis_type != 'categorical') {
        // histogram.
        args.orientation = 'vertical';
      }

      raw_data_transformation(args);

      process_point(args);
      init$1(args);

      let xMaker;
      let yMaker;

      if (args.x_axis_type === 'categorical') {
        xMaker = scale_factory(args)
          .namespace('x')
          .categoricalDomainFromData()
          .categoricalRangeBands([0, args.xgroup_height], args.xgroup_accessor === null);

        if (args.xgroup_accessor) {
          new scale_factory(args)
            .namespace('xgroup')
            .categoricalDomainFromData()
            .categoricalRangeBands('bottom');

        } else {
          args.scales.XGROUP = d => mg_get_plot_left(args);
          args.scalefns.xgroupf = d => mg_get_plot_left(args);
        }

        args.scalefns.xoutf = d => args.scalefns.xf(d) + args.scalefns.xgroupf(d);
      } else {
        xMaker = scale_factory(args)
          .namespace('x')
          .inflateDomain(true)
          .zeroBottom(args.y_axis_type === 'categorical')
          .numericalDomainFromData((args.baselines || []).map(d => d[args.x_accessor]))
          .numericalRange('bottom');

        args.scalefns.xoutf = args.scalefns.xf;
      }

      // y-scale generation. This needs to get simplified.
      if (args.y_axis_type === 'categorical') {
        yMaker = scale_factory(args)
          .namespace('y')
          .zeroBottom(true)
          .categoricalDomainFromData()
          .categoricalRangeBands([0, args.ygroup_height], true);

        if (args.ygroup_accessor) {

          new scale_factory(args)
            .namespace('ygroup')
            .categoricalDomainFromData()
            .categoricalRangeBands('left');

        } else {
          args.scales.YGROUP = () => mg_get_plot_top(args);
          args.scalefns.ygroupf = d => mg_get_plot_top(args);

        }
        args.scalefns.youtf = d => args.scalefns.yf(d) + args.scalefns.ygroupf(d);

      } else {
        const baselines = (args.baselines || []).map(d => d[args.y_accessor]);

        yMaker = scale_factory(args)
          .namespace('y')
          .inflateDomain(true)
          .zeroBottom(args.x_axis_type === 'categorical')
          .numericalDomainFromData(baselines)
          .numericalRange('left');

        args.scalefns.youtf = d => args.scalefns.yf(d);
      }

      if (args.ygroup_accessor !== null) {
        args.ycolor_accessor = args.y_accessor;
        scale_factory(args)
          .namespace('ycolor')
          .scaleName('color')
          .categoricalDomainFromData()
          .categoricalColorRange();
      }

      if (args.xgroup_accessor !== null) {
        args.xcolor_accessor = args.x_accessor;
        scale_factory(args)
          .namespace('xcolor')
          .scaleName('color')
          .categoricalDomainFromData()
          .categoricalColorRange();
      }

      // if (args.ygroup_accessor !== null) {
      //   scale_factory(args)
      //     .namespace('ygroup')
      //     .categoricalDomainFromData()
      //     .categoricalColorRange();
      // }

      new axis_factory(args)
        .namespace('x')
        .type(args.x_axis_type)
        .zeroLine(args.y_axis_type === 'categorical')
        .position(args.x_axis_position)
        .draw();

      new axis_factory(args)
        .namespace('y')
        .type(args.y_axis_type)
        .zeroLine(args.x_axis_type === 'categorical')
        .position(args.y_axis_position)
        .draw();

      //mg_categorical_group_color_scale(args);

      this.mainPlot();
      this.markers();
      this.rollover();
      this.windowListeners();
      //scaffold(args)

      return this;
    };

    this.mainPlot = () => {
      const svg = mg_get_svg_child_of$1(args.target);
      const data = args.data[0];
      let barplot = svg.select('g.mg-barplot');
      const fresh_render = barplot.empty();

      let bars;

      const perform_load_animation = fresh_render && args.animate_on_load;
      const should_transition = perform_load_animation || args.transition_on_update;
      const transition_duration = args.transition_duration || 1000;

      // draw the plot on first render
      if (fresh_render) {
        barplot = svg.append('g')
          .classed('mg-barplot', true);
      }

      bars = barplot.selectAll('.mg-bar')
        .data(data)
        .enter()
        .append('rect')
          .classed('mg-bar', true)
          .classed('default-bar', args.scales.hasOwnProperty('COLOR') ? false : true);

      // setup transitions
      // if (should_transition) {
      //   bars = bars.transition()
      //     .duration(transition_duration);

      //   if (predictor_bars) {
      //     predictor_bars = predictor_bars.transition()
      //       .duration(transition_duration);
      //   }

      //   if (baseline_marks) {
      //     baseline_marks = baseline_marks.transition()
      //       .duration(transition_duration);
      //   }
      // }

      //appropriate_size = args.scales.Y_ingroup.rangeBand()/1.5;
      let length, width, length_type, width_type, length_coord, width_coord,
          length_scalefn, width_scalefn, length_scale, width_scale,
          length_accessor, width_accessor, length_coord_map, length_map;

      let reference_length_map, reference_length_coord_fn;

      if (args.orientation == 'vertical') {
        length = 'height';
        width = 'width';
        length_type = args.y_axis_type;
        width_type = args.x_axis_type;
        length_coord = 'y';
        width_coord = 'x';
        length_scalefn = length_type == 'categorical' ? args.scalefns.youtf : args.scalefns.yf;
        width_scalefn  = width_type == 'categorical' ? args.scalefns.xoutf : args.scalefns.xf;
        length_scale   = args.scales.Y;
        width_scale     = args.scales.X;
        length_accessor = args.y_accessor;
        width_accessor = args.x_accessor;

        length_coord_map = d => {
          let l;
          l = length_scalefn(d);
          if (d[length_accessor] < 0) {
            l = length_scale(0);
          }
          return l;
        };

        length_map = d => Math.abs(length_scalefn(d) - length_scale(0));

        reference_length_map = d => Math.abs(length_scale(d[args.reference_accessor]) - length_scale(0));

        reference_length_coord_fn = d => length_scale(d[args.reference_accessor]);
      }

      if (args.orientation == 'horizontal') {
        length = 'width';
        width = 'height';
        length_type = args.x_axis_type;
        width_type = args.y_axis_type;
        length_coord = 'x';
        width_coord = 'y';
        length_scalefn = length_type == 'categorical' ? args.scalefns.xoutf : args.scalefns.xf;
        width_scalefn = width_type == 'categorical' ? args.scalefns.youtf : args.scalefns.yf;
        length_scale = args.scales.X;
        width_scale = args.scales.Y;
        length_accessor = args.x_accessor;
        width_accessor = args.y_accessor;

        length_coord_map = d => {
          let l;
          l = length_scale(0);
          return l;
        };

        length_map = d => Math.abs(length_scalefn(d) - length_scale(0));

        reference_length_map = d => Math.abs(length_scale(d[args.reference_accessor]) - length_scale(0));

        reference_length_coord_fn = d => length_scale(0);
      }

      // if (perform_load_animation) {
      //   bars.attr(length, 0);

      //   if (predictor_bars) {
      //     predictor_bars.attr(length, 0);
      //   }

      //   // if (baseline_marks) {
      //   //   baseline_marks.attr({
      //   //     x1: args.scales.X(0),
      //   //     x2: args.scales.X(0)
      //   //   });
      //   // }
      // }

      bars.attr(length_coord, length_coord_map);

      // bars.attr(length_coord, 40)
      //bars.attr(width_coord, 70)

      bars.attr(width_coord, d => {
        let w;
        if (width_type == 'categorical') {
          w = width_scalefn(d);
        } else {
          w = width_scale(0);
          if (d[width_accessor] < 0) {
            w = width_scalefn(d);
          }
        }
        w = w - args.bar_thickness/2;
        return w;
      });

      if (args.scales.COLOR) {
        bars.attr('fill', args.scalefns.colorf);
      }

      bars
        .attr(length, length_map)
        .attr(width, d => args.bar_thickness);

      if (args.reference_accessor !== null) {
        const reference_data = data.filter(d => d.hasOwnProperty(args.reference_accessor));
        const reference_bars = barplot.selectAll('.mg-categorical-reference')
          .data(reference_data)
          .enter()
          .append('rect');

        reference_bars
          .attr(length_coord, reference_length_coord_fn)
          .attr(width_coord, d => width_scalefn(d) - args.reference_thickness/2)
          .attr(length, reference_length_map)
          .attr(width, args.reference_thickness);
      }

      if (args.comparison_accessor !== null) {
        let comparison_thickness = null;
        if (args.comparison_thickness === null) {
          comparison_thickness = args.bar_thickness/2;
        } else {
          comparison_thickness = args.comparison_thickness;
        }

        const comparison_data = data.filter(d => d.hasOwnProperty(args.comparison_accessor));
        const comparison_marks = barplot.selectAll('.mg-categorical-comparison')
          .data(comparison_data)
          .enter()
          .append('line');

        comparison_marks
          .attr(`${length_coord}1`, d => length_scale(d[args.comparison_accessor]))
          .attr(`${length_coord}2`, d => length_scale(d[args.comparison_accessor]))
          .attr(`${width_coord}1`,  d => width_scalefn(d) - comparison_thickness/2)
          .attr(`${width_coord}2`, d => width_scalefn(d) + comparison_thickness/2)
          .attr('stroke', 'black')
          .attr('stroke-width', args.comparison_width);
      }

        //bars.attr(width_coord, );
        // bars.attr('width', 50);
        // bars.attr('height', 50);
        // bars.attr('y', function(d){
        //   var y = args.scales.Y(0);
        //   if (d[args.y_accessor] < 0) {
        //     y = args.scalefns.yf(d);
        //   }
        //   return y;
        // });

        // bars.attr('x', function(d){
        //   return 40;
        // })

        // bars.attr('width', function(d){
        //   return 100;
        // });

        // bars.attr('height', 100);

        // bars.attr('fill', 'black');
        // bars.attr('x', function(d) {
        //   var x = args.scales.X(0);
        //   if (d[args.x_accessor] < 0) {
        //     x = args.scalefns.xf(d);
        //   }
        //   return x;
        // })
        // TODO - reimplement.
        // if (args.predictor_accessor) {
        //   predictor_bars
        //     .attr('x', args.scales.X(0))
        //     .attr('y', function(d) {
        //       return args.scalefns.ygroupf(d) + args.scalefns.yf(d) + args.scales.Y.rangeBand() * (7 / 16) // + pp0 * appropriate_size/(pp*2) + appropriate_size / 2;
        //     })
        //     .attr('height', args.scales.Y.rangeBand() / 8) //appropriate_size / pp)
        //     .attr('width', function(d) {
        //       return args.scales.X(d[args.predictor_accessor]) - args.scales.X(0);
        //     });
        // }

      // TODO - reimplement.
      //   if (args.baseline_accessor) {

      //     baseline_marks
      //       .attr('x1', function(d) {
      //         return args.scales.X(d[args.baseline_accessor]); })
      //       .attr('x2', function(d) {
      //         return args.scales.X(d[args.baseline_accessor]); })
      //       .attr('y1', function(d) {
      //         return args.scalefns.ygroupf(d) + args.scalefns.yf(d) + args.scales.Y.rangeBand() / 4
      //       })
      //       .attr('y2', function(d) {
      //         return args.scalefns.ygroupf(d) + args.scalefns.yf(d) + args.scales.Y.rangeBand() * 3 / 4
      //       });
      //   }
        if (args.legend || (args.color_accessor !== null && args.ygroup_accessor !== args.color_accessor)) {
        if (!args.legend_target) legend_on_graph(svg, args);
        else mg_targeted_legend(args);
      }
      return this;
    };

    this.markers = () => {
      markers(args);
      return this;
    };

    this.rollover = () => {
      const svg = mg_get_svg_child_of$1(args.target);
      let g;

      if (svg.selectAll('.mg-active-datapoint-container').nodes().length === 0) {
        mg_add_g(svg, 'mg-active-datapoint-container');
      }

      //remove the old rollovers if they already exist
      svg.selectAll('.mg-rollover-rect').remove();
      svg.selectAll('.mg-active-datapoint').remove();

      // get orientation
      let length, width, length_type, width_type, length_coord, width_coord,
          length_scalefn, width_scalefn, length_scale, width_scale,
          length_accessor, width_accessor;

      let length_coord_map, length_map;

      if (args.orientation == 'vertical') {
        length = 'height';
        width = 'width';
        length_type = args.y_axis_type;
        width_type = args.x_axis_type;
        length_coord = 'y';
        width_coord = 'x';
        length_scalefn = length_type == 'categorical' ? args.scalefns.youtf : args.scalefns.yf;
        width_scalefn  = width_type == 'categorical' ? args.scalefns.xoutf : args.scalefns.xf;
        length_scale   = args.scales.Y;
        width_scale     = args.scales.X;
        length_accessor = args.y_accessor;
        width_accessor = args.x_accessor;

        length_coord_map = d => mg_get_plot_top(args);

        length_map = d => args.height -args.top-args.bottom-args.buffer*2;
      }

      if (args.orientation == 'horizontal') {
        length = 'width';
        width = 'height';
        length_type = args.x_axis_type;
        width_type = args.y_axis_type;
        length_coord = 'x';
        width_coord = 'y';
        length_scalefn = length_type == 'categorical' ? args.scalefns.xoutf : args.scalefns.xf;
        width_scalefn = width_type == 'categorical' ? args.scalefns.youtf : args.scalefns.yf;
        length_scale = args.scales.X;
        width_scale = args.scales.Y;
        length_accessor = args.x_accessor;
        width_accessor = args.y_accessor;

        length_coord_map = d => {
          let l;
          l = length_scale(0);
          return l;
        };

        length_map = d => args.width -args.left-args.right-args.buffer*2;
      }

      //rollover text
      let rollover_x, rollover_anchor;
      if (args.rollover_align === 'right') {
        rollover_x = args.width - args.right;
        rollover_anchor = 'end';
      } else if (args.rollover_align === 'left') {
        rollover_x = args.left;
        rollover_anchor = 'start';
      } else {
        rollover_x = (args.width - args.left - args.right) / 2 + args.left;
        rollover_anchor = 'middle';
      }

      svg.append('text')
        .attr('class', 'mg-active-datapoint')
        .attr('xml:space', 'preserve')
        .attr('x', rollover_x)
        .attr('y', args.top * 0.75)
        .attr('dy', '.35em')
        .attr('text-anchor', rollover_anchor);

      g = svg.append('g')
        .attr('class', 'mg-rollover-rect');

      //draw rollover bars
      const bars = g.selectAll(".mg-bar-rollover")
        .data(args.data[0]).enter()
        .append("rect")
        .attr('class', 'mg-bar-rollover');

      bars.attr('opacity', 0)
        .attr(length_coord, length_coord_map)
        .attr(width_coord, d => {
          let w;
          if (width_type == 'categorical') {
            w = width_scalefn(d);
          } else {
            w = width_scale(0);
            if (d[width_accessor] < 0) {
              w = width_scalefn(d);
            }
          }
          w = w - args.bar_thickness/2;
          return w;
        });

      bars.attr(length, length_map);
      bars.attr(width, d => args.bar_thickness);

      bars
        .on('mouseover', this.rolloverOn(args))
        .on('mouseout', this.rolloverOff(args))
        .on('mousemove', this.rolloverMove(args));

      return this;
    };

    this.rolloverOn = (args) => {
      const svg = mg_get_svg_child_of$1(args.target);
      const label_accessor = this.is_vertical ? args.x_accessor : args.y_accessor;
      const data_accessor = this.is_vertical ? args.y_accessor : args.x_accessor;
      const label_units = this.is_vertical ? args.yax_units : args.xax_units;

      return (d, i) => {

        const fmt = time_format(args.utc_time, '%b %e, %Y');
        const num = format_rollover_number(args);

        //highlight active bar
        const bar = svg.selectAll('g.mg-barplot .mg-bar')
          .filter((d, j) => j === i).classed('active', true);

        if (args.scales.hasOwnProperty('COLOR')) {
          bar.attr('fill', d3.rgb(args.scalefns.colorf(d)).darker());
        } else {
          bar.classed('default-active', true);
        }

        //update rollover text
        if (args.show_rollover_text) {
          const mouseover = mg_mouseover_text(args, { svg });
          let row = mouseover.mouseover_row();

          if (args.ygroup_accessor) row.text(`${d[args.ygroup_accessor]}   `).bold();

          row.text(mg_format_x_mouseover(args, d));
          row.text(`${args.y_accessor}: ${d[args.y_accessor]}`);
          if (args.predictor_accessor || args.baseline_accessor) {
            row = mouseover.mouseover_row();

            if (args.predictor_accessor) row.text(mg_format_data_for_mouseover(args, d, null, args.predictor_accessor, false));
            if (args.baseline_accessor) row.text(mg_format_data_for_mouseover(args, d, null, args.baseline_accessor, false));
          }
        }
        if (args.mouseover) {
          args.mouseover(d, i);
        }
      };
    };

    this.rolloverOff = (args) => {
      const svg = mg_get_svg_child_of$1(args.target);

      return (d, i) => {
        //reset active bar
        const bar = svg.selectAll('g.mg-barplot .mg-bar.active').classed('active', false);

        if (args.scales.hasOwnProperty('COLOR')) {
          bar.attr('fill', args.scalefns.colorf(d));
        } else {
          bar.classed('default-active', false);
        }

        //reset active data point text
        svg.select('.mg-active-datapoint')
          .text('');

        mg_clear_mouseover_container(svg);

        if (args.mouseout) {
          args.mouseout(d, i);
        }
      };
    };

    this.rolloverMove = (args) => (d, i) => {
      if (args.mousemove) {
        args.mousemove(d, i);
      }
    };

    this.windowListeners = () => {
      mg_window_listeners(this.args);
      return this;
    };

    this.init(args);
  }

  const barchartOptions = {
    buffer: [16, 'number'],
    y_accessor: ['factor', 'string'],
    x_accessor: ['value', 'string'],
    reference_accessor: [null, 'string'],
    comparison_accessor: [null, 'string'],
    secondary_label_accessor: [null, 'string'],
    color_accessor: [null, 'string'],
    color_type: ['category', ['number', 'category']],
    color_domain: [null, 'number[]'],
    reference_thickness: [1, 'number'],
    comparison_width: [3, 'number'],
    comparison_thickness: [null, 'number'],
    legend: [false, 'boolean'],
    legend_target: [null, 'string'],
    mouseover_align: ['right', ['right', 'left']],
    baseline_accessor: [null, 'string'],
    predictor_accessor: [null, 'string'],
    predictor_proportion: [5, 'number'],
    show_bar_zero: [true, 'boolean'],
    binned: [true, 'boolean'],
    truncate_x_labels: [true, 'boolean'],
    truncate_y_labels: [true, 'boolean']
  };

  function mg_line_color_text(elem, line_id, {color, colors}) {
    elem.classed('mg-hover-line-color', color === null)
      .classed(`mg-hover-line${line_id}-color`, colors === null)
      .attr('fill', colors === null ? '' : colors[line_id - 1]);
  }

  function mg_line_graph_generators(args, plot, svg) {
    mg_add_line_generator(args, plot);
    mg_add_area_generator(args, plot);
    mg_add_flat_line_generator(args, plot);
    mg_add_confidence_band_generator(args, plot, svg);
  }

  function mg_add_confidence_band_generator(args, plot, svg) {
    plot.existing_band = svg.selectAll('.mg-confidence-band').nodes();
    if (args.show_confidence_band) {
      plot.confidence_area = d3.area()
        .defined(plot.line.defined())
        .x(args.scalefns.xf)
        .y0(d => {
          const l = args.show_confidence_band[0];
          if (d[l] != undefined) {
            return args.scales.Y(d[l]);
          } else {
            return args.scales.Y(d[args.y_accessor]);
          }
        })
        .y1(d => {
          const u = args.show_confidence_band[1];
          if (d[u] != undefined) {
            return args.scales.Y(d[u]);
          } else {
            return args.scales.Y(d[args.y_accessor]);
          }
        })
        .curve(args.interpolate);
    }
  }

  function mg_add_area_generator({scalefns, scales, interpolate, flip_area_under_y_value}, plot) {

    const areaBaselineValue = (Number.isFinite(flip_area_under_y_value)) ? scales.Y(flip_area_under_y_value) : scales.Y.range()[0];

    plot.area = d3.area()
      .defined(plot.line.defined())
      .x(scalefns.xf)
      .y0(() => {
        return areaBaselineValue;
      })
      .y1(scalefns.yf)
      .curve(interpolate);
  }

  function mg_add_flat_line_generator({y_accessor, scalefns, scales, interpolate}, plot) {
    plot.flat_line = d3.line()
      .defined(d => (d['_missing'] === undefined || d['_missing'] !== true) && d[y_accessor] !== null)
      .x(scalefns.xf)
      .y(() => scales.Y(plot.data_median))
      .curve(interpolate);
  }

  function mg_add_line_generator({scalefns, interpolate, missing_is_zero, y_accessor}, plot) {
    plot.line = d3.line()
      .x(scalefns.xf)
      .y(scalefns.yf)
      .curve(interpolate);

    // if missing_is_zero is not set, then hide data points that fall in missing
    // data ranges or that have been explicitly identified as missing in the
    // data source.
    if (!missing_is_zero) {
      // a line is defined if the _missing attrib is not set to true
      // and the y-accessor is not null
      plot.line = plot.line.defined(d => (d['_missing'] === undefined || d['_missing'] !== true) && d[y_accessor] !== null);
    }
  }

  function mg_add_confidence_band(
    {show_confidence_band, transition_on_update, data, target},
    plot,
    svg,
    which_line
  ) {
    if (show_confidence_band) {
      let confidenceBand;
      if (svg.select(`.mg-confidence-band-${which_line}`).empty()) {
        svg.append('path')
          .attr('class', `mg-confidence-band mg-confidence-band-${which_line}`);
      }

      // transition this line's confidence band
      confidenceBand = svg.select(`.mg-confidence-band-${which_line}`);

      confidenceBand
        .transition()
        .duration(() => (transition_on_update) ? 1000 : 0)
        .attr('d', plot.confidence_area(data[which_line - 1]))
        .attr('clip-path', `url(#mg-plot-window-${mg_target_ref(target)})`);
    }
  }

  function mg_add_area({data, target, colors}, plot, svg, which_line, line_id) {
    const areas = svg.selectAll(`.mg-main-area.mg-area${line_id}`);
    if (plot.display_area) {
      // if area already exists, transition it
      if (!areas.empty()) {
        svg.node().appendChild(areas.node());

        areas.transition()
          .duration(plot.update_transition_duration)
          .attr('d', plot.area(data[which_line]))
          .attr('clip-path', `url(#mg-plot-window-${mg_target_ref(target)})`);
      } else { // otherwise, add the area
        svg.append('path')
          .classed('mg-main-area', true)
          .classed(`mg-area${line_id}`, true)
          .classed('mg-area-color', colors === null)
          .classed(`mg-area${line_id}-color`, colors === null)
          .attr('d', plot.area(data[which_line]))
          .attr('fill', colors === null ? '' : colors[line_id - 1])
          .attr('clip-path', `url(#mg-plot-window-${mg_target_ref(target)})`);
      }
    } else if (!areas.empty()) {
      areas.remove();
    }
  }

  function mg_default_color_for_path(this_path, line_id) {
    this_path.classed('mg-line-color', true)
             .classed(`mg-line${line_id}-color`, true);
  }

  function mg_color_line({colors}, this_path, which_line, line_id) {
    if (colors) {
      // for now, if args.colors is not an array, then keep moving as if nothing happened.
      // if args.colors is not long enough, default to the usual line_id color.
      if (colors.constructor === Array) {
        this_path.attr('stroke', colors[which_line]);
        if (colors.length < which_line + 1) {
          // Go with default coloring.
          // this_path.classed('mg-line' + (line_id) + '-color', true);
          mg_default_color_for_path(this_path, line_id);
        }
      } else {
        // this_path.classed('mg-line' + (line_id) + '-color', true);
        mg_default_color_for_path(this_path, line_id);
      }
    } else {
      // this is the typical workflow
      // this_path.classed('mg-line' + (line_id) + '-color', true);
      mg_default_color_for_path(this_path, line_id);
    }
  }

  function mg_add_line_element({animate_on_load, data, y_accessor, target}, plot, this_path, which_line) {
    if (animate_on_load) {
      plot.data_median = d3.median(data[which_line], d => d[y_accessor]);
      this_path.attr('d', plot.flat_line(data[which_line]))
        .transition()
        .duration(1000)
        .attr('d', plot.line(data[which_line]))
        .attr('clip-path', `url(#mg-plot-window-${mg_target_ref(target)})`);
    } else { // or just add the line
      this_path.attr('d', plot.line(data[which_line]))
        .attr('clip-path', `url(#mg-plot-window-${mg_target_ref(target)})`);
    }
  }

  function mg_add_line(args, plot, svg, existing_line, which_line, line_id) {
    if (!existing_line.empty()) {
      svg.node().appendChild(existing_line.node());

      const lineTransition = existing_line.transition()
        .duration(plot.update_transition_duration);

      if (!plot.display_area && args.transition_on_update && !args.missing_is_hidden) {
        lineTransition.attrTween('d', path_tween(plot.line(args.data[which_line]), 4));
      } else {
        lineTransition.attr('d', plot.line(args.data[which_line]));
      }
    } else { // otherwise...
      // if we're animating on load, animate the line from its median value
      const this_path = svg.append('path')
        .attr('class', `mg-main-line mg-line${line_id}`);

      mg_color_line(args, this_path, which_line, line_id);
      mg_add_line_element(args, plot, this_path, which_line);
    }
  }

  function mg_add_legend_element(args, plot, which_line, line_id) {
    let this_legend;
    if (args.legend) {
      if (Array.isArray(args.legend)) {
        this_legend = args.legend[which_line];
      } else if (is_function(args.legend)) {
        this_legend = args.legend(args.data[which_line]);
      }

      if (args.legend_target) {
        if (args.colors && args.colors.constructor === Array) {
          plot.legend_text = `<span style='color:${args.colors[which_line]}'>&mdash; ${this_legend}&nbsp; </span>${plot.legend_text}`;
        } else {
          plot.legend_text = `<span class='mg-line${line_id}-legend-color'>&mdash; ${this_legend}&nbsp; </span>${plot.legend_text}`;
        }
      } else {
        let anchor_point, anchor_orientation, dx;

        if (args.y_axis_position === 'left') {
          anchor_point = args.data[which_line][args.data[which_line].length - 1];
          anchor_orientation = 'start';
          dx = args.buffer;
        } else {
          anchor_point = args.data[which_line][0];
          anchor_orientation = 'end';
          dx = -args.buffer;
        }
        const legend_text = plot.legend_group.append('svg:text')
          .attr('x', args.scalefns.xf(anchor_point))
          .attr('dx', dx)
          .attr('y', args.scalefns.yf(anchor_point))
          .attr('dy', '.35em')
          .attr('font-size', 10)
          .attr('text-anchor', anchor_orientation)
          .attr('font-weight', '300')
          .text(this_legend);

        if (args.colors && args.colors.constructor === Array) {
          if (args.colors.length < which_line + 1) {
            legend_text.classed(`mg-line${line_id}-legend-color`, true);
          } else {
            legend_text.attr('fill', args.colors[which_line]);
          }
        } else {
          legend_text.classed('mg-line-legend-color', true)
            .classed(`mg-line${line_id}-legend-color`, true);
        }

        mg_prevent_vertical_overlap(plot.legend_group.selectAll('.mg-line-legend text').nodes(), args);
      }
    }
  }

  function mg_plot_legend_if_legend_target(target, legend) {
    if (target) d3.select(target).html(legend);
  }

  function mg_add_legend_group({legend}, plot, svg) {
    if (legend) plot.legend_group = mg_add_g(svg, 'mg-line-legend');
  }

  function mg_remove_existing_line_rollover_elements(svg) {
    // remove the old rollovers if they already exist
    mg_selectAll_and_remove$1(svg, '.mg-rollover-rect');
    mg_selectAll_and_remove$1(svg, '.mg-voronoi');

    // remove the old rollover text and circle if they already exist
    mg_selectAll_and_remove$1(svg, '.mg-active-datapoint');
    mg_selectAll_and_remove$1(svg, '.mg-line-rollover-circle');
    //mg_selectAll_and_remove(svg, '.mg-active-datapoint-container');
  }

  function mg_add_rollover_circle({data, colors}, svg) {
    // append circle
    const circle = svg.selectAll('.mg-line-rollover-circle')
      .data(data)
      .enter().append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', 0);

    if (colors && colors.constructor === Array) {
      circle
        .attr('class', ({__line_id__}) => `mg-line${__line_id__}`)
        .attr('fill', (d, i) => colors[i])
        .attr('stroke', (d, i) => colors[i]);
    } else {
      circle.attr('class', ({__line_id__}, i) => [
        `mg-line${__line_id__}`,
        `mg-line${__line_id__}-color`,
        `mg-area${__line_id__}-color`
      ].join(' '));
    }
    circle.classed('mg-line-rollover-circle', true);
  }

  function mg_set_unique_line_id_for_each_series({data, custom_line_color_map}) {
    // update our data by setting a unique line id for each series
    // increment from 1... unless we have a custom increment series

    for (let i = 0; i < data.length; i++) {
      data[i].forEach(datum => {
        datum.__index__ = i + 1;
        datum.__line_id__ = (custom_line_color_map.length > 0) ? custom_line_color_map[i] : i + 1;
      });
    }
  }

  function mg_nest_data_for_voronoi({data}) {
    return d3.merge(data);
  }

  function mg_line_class_string(args) {
    return d => {
      let class_string;

      if (args.linked) {
        const v = d[args.x_accessor];
        const formatter = time_format(args.utc_time, args.linked_format);

        // only format when x-axis is date
        const id = (typeof v === 'number') ? (d.__line_id__ - 1) : formatter(v);
        class_string = `roll_${id} mg-line${d.__line_id__}`;

        if (args.color === null) {
          class_string += ` mg-line${d.__line_id__}-color`;
        }
        return class_string;

      } else {
        class_string = `mg-line${d.__line_id__}`;
        if (args.color === null) class_string += ` mg-line${d.__line_id__}-color`;
        return class_string;
      }
    };
  }

  function mg_add_voronoi_rollover(args, svg, rollover_on, rollover_off, rollover_move, rollover_click) {
    const voronoi = d3.voronoi()
      .x(d => args.scales.X(d[args.x_accessor]).toFixed(2))
      .y(d => args.scales.Y(d[args.y_accessor]).toFixed(2))
      .extent([
        [args.buffer, args.buffer + (args.title ? args.title_y_position : 0)],
        [args.width - args.buffer, args.height - args.buffer]
      ]);

    const g = mg_add_g(svg, 'mg-voronoi');
    g.selectAll('path')
      .data(voronoi.polygons(mg_nest_data_for_voronoi(args)))
      .enter()
      .append('path')
      .filter(d => d !== undefined && d.length > 0)
      .attr('d', d => d == null ? null : `M${d.join('L')}Z`)
      .datum(d => d == null ? null : d.data) // because of d3.voronoi, reassign d
      .attr('class', mg_line_class_string(args))
      .on('click', rollover_click)
      .on('mouseover', rollover_on)
      .on('mouseout', rollover_off)
      .on('mousemove', rollover_move);

    mg_configure_voronoi_rollover(args, svg);
  }

  function nest_data_for_aggregate_rollover({x_accessor, data, x_sort}) {
    const data_nested = d3.nest()
      .key(d => d[x_accessor])
      .entries(d3.merge(data));
    data_nested.forEach(entry => {
      const datum = entry.values[0];
      entry.key = datum[x_accessor];
    });

    if (x_sort) {
      return data_nested.sort((a, b) => new Date(a.key) - new Date(b.key));
    } else {
      return data_nested;
    }
  }

  function mg_add_aggregate_rollover(args, svg, rollover_on, rollover_off, rollover_move, rollover_click) {
    // Undo the keys getting coerced to strings, by setting the keys from the values
    // This is necessary for when we have X axis keys that are things like
    const data_nested = nest_data_for_aggregate_rollover(args);

    const xf = data_nested.map(({key}) => args.scales.X(key));

    const g = svg.append('g')
      .attr('class', 'mg-rollover-rect');

    g.selectAll('.mg-rollover-rects')
      .data(data_nested).enter()
      .append('rect')
      .attr('x', (d, i) => {
        if (xf.length === 1) return mg_get_plot_left(args);
        else if (i === 0) return xf[i].toFixed(2);
        else return ((xf[i - 1] + xf[i]) / 2).toFixed(2);
      })
      .attr('y', args.top)
      .attr('width', (d, i) => {
        if (xf.length === 1) return mg_get_plot_right(args);
        else if (i === 0) return ((xf[i + 1] - xf[i]) / 2).toFixed(2);
        else if (i === xf.length - 1) return ((xf[i] - xf[i - 1]) / 2).toFixed(2);
        else return ((xf[i + 1] - xf[i - 1]) / 2).toFixed(2);
      })
      .attr('class', ({values}) => {
        let line_classes = values.map(({__line_id__}) => {
          let lc = mg_line_class(__line_id__);
          if (args.colors === null) lc += ` ${mg_line_color_class(__line_id__)}`;
          return lc;
        }).join(' ');
        if (args.linked && values.length > 0) {
          line_classes += ` ${mg_rollover_id_class(mg_rollover_format_id(values[0], args))}`;
        }

        return line_classes;
      })
      .attr('height', args.height - args.bottom - args.top - args.buffer)
      .attr('opacity', 0)
      .on('click', rollover_click)
      .on('mouseover', rollover_on)
      .on('mouseout', rollover_off)
      .on('mousemove', rollover_move);

    mg_configure_aggregate_rollover(args, svg);
  }

  function mg_configure_singleton_rollover({data}, svg) {
    svg.select('.mg-rollover-rect rect')
      .on('mouseover')(data[0][0], 0);
  }

  function mg_configure_voronoi_rollover({data, custom_line_color_map}, svg) {
    for (let i = 0; i < data.length; i++) {
      let j = i + 1;

      if (custom_line_color_map.length > 0 &&
        custom_line_color_map[i] !== undefined) {
        j = custom_line_color_map[i];
      }

      if (data[i].length === 1 && !svg.selectAll(`.mg-voronoi .mg-line${j}`).empty()) {
        svg.selectAll(`.mg-voronoi .mg-line${j}`)
          .on('mouseover')(data[i][0], 0);

        svg.selectAll(`.mg-voronoi .mg-line${j}`)
          .on('mouseout')(data[i][0], 0);
      }
    }
  }

  function mg_line_class(line_id) {
    return `mg-line${line_id}`;
  }

  function mg_line_color_class(line_id) {
    return `mg-line${line_id}-color`;
  }

  function mg_rollover_id_class(id) {
    return `roll_${id}`;
  }

  function mg_rollover_format_id(d, {x_accessor, utc_time, linked_format}) {
    const v = d[x_accessor];
    const formatter = time_format(utc_time, linked_format);
    // only format when x-axis is date
    return (typeof v === 'number') ? v.toString().replace('.', '_') : formatter(v);
  }

  function mg_add_single_line_rollover(args, svg, rollover_on, rollover_off, rollover_move, rollover_click) {
    // set to 1 unless we have a custom increment series
    let line_id = 1;
    if (args.custom_line_color_map.length > 0) {
      line_id = args.custom_line_color_map[0];
    }

    const g = svg.append('g')
      .attr('class', 'mg-rollover-rect');

    const xf = args.data[0].map(args.scalefns.xf);

    g.selectAll('.mg-rollover-rects')
      .data(args.data[0]).enter()
      .append('rect')
      .attr('class', (d, i) => {
        let cl = `${mg_line_color_class(line_id)} ${mg_line_class(d.__line_id__)}`;
        if (args.linked) cl += `${cl} ${mg_rollover_id_class(mg_rollover_format_id(d, args))}`;
        return cl;
      })
      .attr('x', (d, i) => {
        // if data set is of length 1
        if (xf.length === 1) return mg_get_plot_left(args);
        else if (i === 0) return xf[i].toFixed(2);
        else return ((xf[i - 1] + xf[i]) / 2).toFixed(2);
      })
      .attr('y', (d, i) => (args.data.length > 1) ? args.scalefns.yf(d) - 6 // multi-line chart sensitivity
      : args.top)
      .attr('width', (d, i) => {
        // if data set is of length 1
        if (xf.length === 1) return mg_get_plot_right(args);
        else if (i === 0) return ((xf[i + 1] - xf[i]) / 2).toFixed(2);
        else if (i === xf.length - 1) return ((xf[i] - xf[i - 1]) / 2).toFixed(2);
        else return ((xf[i + 1] - xf[i - 1]) / 2).toFixed(2);
      })
      .attr('height', (d, i) => (args.data.length > 1) ? 12 // multi-line chart sensitivity
      : args.height - args.bottom - args.top - args.buffer)
      .attr('opacity', 0)
      .on('click', rollover_click)
      .on('mouseover', rollover_on)
      .on('mouseout', rollover_off)
      .on('mousemove', rollover_move);

    if (mg_is_singleton(args)) {
      mg_configure_singleton_rollover(args, svg);
    }
  }

  function mg_configure_aggregate_rollover({data}, svg) {
    const rect = svg.selectAll('.mg-rollover-rect rect');
    const rect_first = rect.nodes()[0][0] || rect.nodes()[0];
    if (data.filter(({length}) => length === 1).length > 0) {
      rect.on('mouseover')(rect_first.__data__, 0);
    }
  }

  function mg_is_standard_multiline({data, aggregate_rollover}) {
    return data.length > 1 && !aggregate_rollover;
  }

  function mg_is_aggregated_rollover({data, aggregate_rollover}) {
    return data.length > 1 && aggregate_rollover;
  }

  function mg_is_singleton({data}) {
    return data.length === 1 && data[0].length === 1;
  }

  function mg_draw_all_line_elements(args, plot, svg) {
    mg_remove_dangling_bands(plot, svg);

    // If option activated, remove existing active points if exists
    if (args.active_point_on_lines) {
      svg.selectAll('circle.mg-shown-active-point').remove();
    }

    for (let i = args.data.length - 1; i >= 0; i--) {
      const this_data = args.data[i];

      // passing the data for the current line
      call_hook('line.before_each_series', [this_data, args]);

      // override increment if we have a custom increment series
      let line_id = i + 1;
      if (args.custom_line_color_map.length > 0) {
        line_id = args.custom_line_color_map[i];
      }

      args.data[i].__line_id__ = line_id;

      // If option activated, add active points for each lines
      if (args.active_point_on_lines) {
        svg.selectAll('circle-' + line_id)
          .data(args.data[i])
          .enter()
          .filter((d) => {
            return d[args.active_point_accessor];
          })
          .append('circle')
          .attr('class', 'mg-area' + (line_id) + '-color mg-shown-active-point')
          .attr('cx', args.scalefns.xf)
          .attr('cy', args.scalefns.yf)
          .attr('r', () => {
            return args.active_point_size;
          });
      }

      const existing_line = svg.select(`path.mg-main-line.mg-line${line_id}`);
      if (this_data.length === 0) {
        existing_line.remove();
        continue;
      }

      mg_add_confidence_band(args, plot, svg, line_id);

      if (Array.isArray(args.area)) {
        if (args.area[line_id - 1]) {
          mg_add_area(args, plot, svg, i, line_id);
        }
      } else {
        mg_add_area(args, plot, svg, i, line_id);
      }

      mg_add_line(args, plot, svg, existing_line, i, line_id);
      mg_add_legend_element(args, plot, i, line_id);

      // passing the data for the current line
      call_hook('line.after_each_series', [this_data, existing_line, args]);
    }
  }

  function mg_remove_dangling_bands({existing_band}, svg) {
    if (existing_band[0] && existing_band[0].length > svg.selectAll('.mg-main-line').node().length) {
      svg.selectAll('.mg-confidence-band').remove();
    }
  }

  function mg_line_main_plot(args) {
    const plot = {};
    const svg = mg_get_svg_child_of$1(args.target);

    // remove any old legends if they exist
    mg_selectAll_and_remove$1(svg, '.mg-line-legend');
    mg_add_legend_group(args, plot, svg);

    plot.data_median = 0;
    plot.update_transition_duration = (args.transition_on_update) ? 1000 : 0;
    plot.display_area = (args.area && !args.use_data_y_min && args.data.length <= 1 && args.aggregate_rollover === false) || (Array.isArray(args.area) && args.area.length > 0);
    plot.legend_text = '';
    mg_line_graph_generators(args, plot, svg);
    plot.existing_band = svg.selectAll('.mg-confidence-band').nodes();

    // should we continue with the default line render? A `line.all_series` hook should return false to prevent the default.
    const continueWithDefault = call_hook('line.before_all_series', [args]);
    if (continueWithDefault !== false) {
      mg_draw_all_line_elements(args, plot, svg);
    }

    mg_plot_legend_if_legend_target(args.legend_target, plot.legend_text);
  }

  function mg_line_rollover_setup(args, graph) {
    const svg = mg_get_svg_child_of$1(args.target);

    if (args.showActivePoint && svg.selectAll('.mg-active-datapoint-container').nodes().length === 0) {
      mg_add_g(svg, 'mg-active-datapoint-container');
    }

    mg_remove_existing_line_rollover_elements(svg);
    mg_add_rollover_circle(args, svg);
    mg_set_unique_line_id_for_each_series(args);

    if (mg_is_standard_multiline(args)) {
      mg_add_voronoi_rollover(args, svg, graph.rolloverOn(args), graph.rolloverOff(args), graph.rolloverMove(args), graph.rolloverClick(args));
    } else if (mg_is_aggregated_rollover(args)) {
      mg_add_aggregate_rollover(args, svg, graph.rolloverOn(args), graph.rolloverOff(args), graph.rolloverMove(args), graph.rolloverClick(args));
    } else {
      mg_add_single_line_rollover(args, svg, graph.rolloverOn(args), graph.rolloverOff(args), graph.rolloverMove(args), graph.rolloverClick(args));
    }
  }

  function mg_update_rollover_circle(args, svg, d) {
    if (args.aggregate_rollover && args.data.length > 1) {
      // hide the circles in case a non-contiguous series is present
      svg.selectAll('circle.mg-line-rollover-circle')
        .style('opacity', 0);

      d.values.forEach((datum, index, list) => {
        if (args.missing_is_hidden && list[index]['_missing']) {
          return;
        }

        if (mg_data_in_plot_bounds(datum, args)) mg_update_aggregate_rollover_circle(args, svg, datum);
      });
    } else if ((args.missing_is_hidden && d['_missing']) || d[args.y_accessor] === null) {
      // disable rollovers for hidden parts of the line
      // recall that hidden parts are missing data ranges and possibly also
      // data points that have been explicitly identified as missing
      return;
    } else {
      // show circle on mouse-overed rect
      if (mg_data_in_plot_bounds(d, args)) {
        mg_update_generic_rollover_circle(args, svg, d);
      }
    }
  }

  function mg_update_aggregate_rollover_circle({scales, x_accessor, y_accessor, point_size}, svg, datum) {
    svg.select(`circle.mg-line-rollover-circle.mg-line${datum.__line_id__}`)
      .attr('cx', scales.X(datum[x_accessor]).toFixed(2))
      .attr('cy', scales.Y(datum[y_accessor]).toFixed(2))
      .attr('r', point_size)
      .style('opacity', 1);
  }

  function mg_update_generic_rollover_circle({scales, x_accessor, y_accessor, point_size}, svg, d) {
    svg.selectAll(`circle.mg-line-rollover-circle.mg-line${d.__line_id__}`)
      .classed('mg-line-rollover-circle', true)
      .attr('cx', () => scales.X(d[x_accessor]).toFixed(2))
      .attr('cy', () => scales.Y(d[y_accessor]).toFixed(2))
      .attr('r', point_size)
      .style('opacity', 1);
  }

  function mg_trigger_linked_mouseovers(args, d, i) {
    if (args.linked && !MG.globals.link) {
      MG.globals.link = true;
      if (!args.aggregate_rollover || d[args.y_accessor] !== undefined || (d.values && d.values.length > 0)) {
        const datum = d.values ? d.values[0] : d;
        const id = mg_rollover_format_id(datum, args);
        // trigger mouseover on matching line in .linked charts
        d3.selectAll(`.${mg_line_class(datum.__line_id__)}.${mg_rollover_id_class(id)}`)
          .each(function(d) {
            d3.select(this)
              .on('mouseover')(d, i);
          });
      }
    }
  }

  function mg_trigger_linked_mouseouts({linked, utc_time, linked_format, x_accessor}, d, i) {
    if (linked && MG.globals.link) {
      MG.globals.link = false;

      const formatter = time_format(utc_time, linked_format);
      const datums = d.values ? d.values : [d];
      datums.forEach(datum => {
        const v = datum[x_accessor];
        const id = (typeof v === 'number') ? i : formatter(v);

        // trigger mouseout on matching line in .linked charts
        d3.selectAll(`.roll_${id}`)
          .each(function(d) {
            d3.select(this)
              .on('mouseout')(d);
          });
      });
    }
  }

  function mg_remove_active_data_points_for_aggregate_rollover(args, svg) {
    svg.selectAll('circle.mg-line-rollover-circle').filter(({length}) => length > 1)
      .style('opacity', 0);
  }

  function mg_remove_active_data_points_for_generic_rollover({custom_line_color_map, data}, svg, line_id) {
    svg.selectAll(`circle.mg-line-rollover-circle.mg-line${line_id}`)
      .style('opacity', () => {
        let id = line_id - 1;
        if (custom_line_color_map.length > 0 &&
          custom_line_color_map.indexOf(line_id) !== undefined
        ) {
          id = custom_line_color_map.indexOf(line_id);
        }

        if (data[id].length === 1) {
          return 1;
        } else {
          return 0;
        }
      });
  }

  function lineChart(args) {
    this.init = function(args) {
      this.args = args;

      if (!args.data || args.data.length === 0) {
        args.internal_error = 'No data was supplied';
        internal_error(args);
        return this;
      } else {
        args.internal_error = undefined;
      }

      raw_data_transformation(args);
      process_line(args);

      call_hook('line.before_destroy', this);

      init(args);

      // TODO incorporate markers into calculation of x scales
      new scale_factory(args)
        .namespace('x')
        .numericalDomainFromData()
        .numericalRange('bottom');

      const baselines = (args.baselines || []).map(d => d[args.y_accessor]);

      new scale_factory(args)
        .namespace('y')
        .zeroBottom(true)
        .inflateDomain(true)
        .numericalDomainFromData(baselines)
        .numericalRange('left');

      if (args.x_axis) {
        new axis_factory(args)
          .namespace('x')
          .type('numerical')
          .position(args.x_axis_position)
          .rug(x_rug(args))
          .label(mg_add_x_label)
          .draw();
      }

      if (args.y_axis) {
        new axis_factory(args)
          .namespace('y')
          .type('numerical')
          .position(args.y_axis_position)
          .rug(y_rug(args))
          .label(mg_add_y_label)
          .draw();
      }

      this.markers();
      this.mainPlot();
      this.rollover();
      this.windowListeners();
      if (args.brush) MG.add_brush_function(args);
      call_hook('line.after_init', this);

      return this;
    };

    this.mainPlot = function() {
      mg_line_main_plot(args);
      return this;
    };

    this.markers = function() {
      markers(args);
      return this;
    };

    this.rollover = function() {
      mg_line_rollover_setup(args, this);
      call_hook('line.after_rollover', args);

      return this;
    };

    this.rolloverClick =  args => (d, i) => {
        if (args.click) {
            args.click(d, i);
        }
    };

    this.rolloverOn = args => {
      const svg = mg_get_svg_child_of$1(args.target);

      return (d, i) => {
        mg_update_rollover_circle(args, svg, d);
        mg_trigger_linked_mouseovers(args, d, i);

        svg.selectAll('text')
          .filter((g, j) => d === g)
          .attr('opacity', 0.3);

        // update rollover text except for missing data points
        if (args.show_rollover_text &&
            !((args.missing_is_hidden && d['_missing']) || d[args.y_accessor] === null)
          ) {
          const mouseover = mg_mouseover_text(args, { svg });
          let row = mouseover.mouseover_row();
          if (args.aggregate_rollover) {
            row.text((args.aggregate_rollover && args.data.length > 1
              ? mg_format_x_aggregate_mouseover
              : mg_format_x_mouseover)(args, d));
          }

          const pts = args.aggregate_rollover && args.data.length > 1
            ? d.values
            : [d];

          pts.forEach(di => {
            if (args.aggregate_rollover) {
              row = mouseover.mouseover_row();
            }

            if (args.legend) {
              mg_line_color_text(row.text(`${args.legend[di.__index__ - 1]}  `).bold(), di.__line_id__, args);
            }

            mg_line_color_text(row.text('\u2014  ').elem, di.__line_id__, args);
            if (!args.aggregate_rollover) {
              row.text(mg_format_x_mouseover(args, di));
            }

            row.text(mg_format_y_mouseover(args, di, args.time_series === false));
          });
        }

        if (args.mouseover) {
          args.mouseover(d, i);
        }
      };
    };

    this.rolloverOff = args => {
      const svg = mg_get_svg_child_of$1(args.target);

      return (d, i) => {
        mg_trigger_linked_mouseouts(args, d, i);
        if (args.aggregate_rollover) {
          mg_remove_active_data_points_for_aggregate_rollover(args, svg);
        } else {
          mg_remove_active_data_points_for_generic_rollover(args, svg, d.__line_id__);
        }

        if (args.data[0].length > 1) {
          mg_clear_mouseover_container(svg);
        }

        if (args.mouseout) {
          args.mouseout(d, i);
        }
      };
    };

    this.rolloverMove = args => (d, i) => {
      if (args.mousemove) {
        args.mousemove(d, i);
      }
    };

    this.windowListeners = function() {
      mg_window_listeners(this.args);
      return this;
    };

    this.init(args);
  }

  const pointChartOptions = {
    color_accessor: [null, 'string'], // the data element to use to map points to colors
    color_range: [null, 'array'], // the range used to color different groups of points
    color_type: ['number', ['number', 'category']], // specifies whether the color scale is quantitative or qualitative
    point_size: [2.5, 'number'], // the radius of the dots in the scatterplot
    size_accessor: [null, 'string'], // should point sizes be mapped to data
    size_range: [null, 'array'], // the range of point sizes
    lowess: [false, 'boolean'], // specifies whether to show a lowess line of best-fit
    least_squares: [false, 'boolean'], // specifies whether to show a least-squares line of best-fit
    y_categorical_show_guides: [true, 'boolean'],
    x_categorical_show_guides: [true, 'boolean'],
    buffer: [16, 'string'],
    label_accessor: [null, 'boolean'],
    size_domain: [null, 'array'],
    color_domain: [null, 'array'],
    active_point_size_increase: [1, 'number'],
    highlight: [null, 'function'] // if this callback function returns true, the selected point will be highlighted
  };

  const CHARTS = {};
  const OPTIONS = {};

  function register(chartType, descriptor, options) {
    const defaults = options ? options_to_defaults(options) : {};
    CHARTS[chartType] = {
      descriptor: descriptor,
      defaults: defaults,
    };
    if (options) {
      Object.keys(options).map(key => {
        if (!(key in options)) {
          OPTIONS[key] = options[key];
        }
      });
    }
  }

  register('bar', barChart, barchartOptions);
  register('line', lineChart);
  register('point', pointChartOptions);

  let deprecations = {
    rollover_callback: { replacement: 'mouseover', version: '2.0' },
    rollout_callback: { replacement: 'mouseout', version: '2.0' },
    x_rollover_format: { replacement: 'x_mouseover', version: '2.10' },
    y_rollover_format: { replacement: 'y_mouseover', version: '2.10' },
    show_years: { replacement: 'show_secondary_x_label', version: '2.1' },
    xax_start_at_min: { replacement: 'axes_not_compact', version: '2.7' },
    interpolate_tension: { replacement: 'interpolate', version: '2.10' }
  };

  let options = { // <name>: [<defaultValue>, <availableType>]
    x_axis_type: [null, ['categorical']], // TO BE INTRODUCED IN 2.10
    y_axis_type: [null, ['categorical']], // TO BE INTRODUCED IN 2.10
    y_padding_percentage: [0.05, 'number'],                 // for categorical scales
    y_outer_padding_percentage: [0.1, 'number'],            // for categorical scales
    ygroup_padding_percentage: [0.25, 'number'],            // for categorical scales
    ygroup_outer_padding_percentage: [0, 'number'],         // for categorical scales
    x_padding_percentage: [0.05, 'number'],                 // for categorical scales
    x_outer_padding_percentage: [0.1, 'number'],            // for categorical scales
    xgroup_padding_percentage: [0.25, 'number'],            // for categorical scales
    xgroup_outer_padding_percentage: [0, 'number'],         // for categorical scales
    ygroup_accessor: [null, 'string'],
    xgroup_accessor: [null, 'string'],
    y_categorical_show_guides: [false, 'boolean'],
    x_categorical_show_guide: [false, 'boolean'],
    rotate_x_labels: [0, 'number'],
    rotate_y_labels: [0, 'number'],
    scales: [{}],
    scalefns: [{}],
    // Data
    data: [[], ['object[]', 'number[]']], // the data object
    missing_is_zero: [false, 'boolean'], // assume missing observations are zero
    missing_is_hidden: [false, 'boolean'], // show missing observations as missing line segments
    missing_is_hidden_accessor: [null, 'string'], // the accessor for identifying observations as missing
    utc_time: [false, 'boolean'], // determines whether to use a UTC or local time scale
    x_accessor: ['date', 'string'], // the data element that's the x-accessor
    x_sort: [true, 'boolean'], // determines whether to sort the x-axis' values
    y_accessor: ['value', ['string', 'string[]']], // the data element that's the y-accessor
    // Axes
    axes_not_compact: [true, 'boolean'], // determines whether to draw compact or non-compact axes
    european_clock: [false, 'boolean'], // determines whether to show labels using a 24-hour clock
    inflator: [10/9, 'number'], // a multiplier for inflating max_x and max_y
    max_x: [null, ['number', Date]], // the maximum x-value
    max_y: [null, ['number', Date]], // the maximum y-value
    min_x: [null, ['number', Date]], // the minimum x-value
    min_y: [null, ['number', Date]], // the minimum y-value
    min_y_from_data: [false, 'boolean'], // starts y-axis at data's minimum value
    show_year_markers: [false, 'boolean'], // determines whether to show year markers along the x-axis
    show_secondary_x_label: [true, 'boolean'], // determines whether to show years along the x-axis
    small_text: [false, 'boolean'],
    x_extended_ticks: [false, 'boolean'], // determines whether to extend the x-axis ticks across the chart
    x_axis: [true, 'boolean'], // determines whether to display the x-axis
    x_label: ['', 'string'], // the label to show below the x-axis
    xax_count: [6, 'number'], // the number of x-axis ticks
    xax_format: [null, 'function'], // a function that formats the x-axis' labels
    xax_tick_length: [5, 'number'], // the x-axis' tick length in pixels
    xax_units: ['', 'string'], // a prefix symbol to be shown alongside the x-axis' labels
    x_scale_type: ['linear', 'log'], // the x-axis scale type
    y_axis: [true, 'boolean'], // determines whether to display the y-axis
    x_axis_position: ['bottom'], // string
    y_axis_position: ['left'], // string
    y_extended_ticks: [false, 'boolean'], // determines whether to extend the y-axis ticks across the chart
    y_label: ['', 'string'], // the label to show beside the y-axis
    y_scale_type: ['linear', ['linear', 'log']], // the y-axis scale type
    yax_count: [3, 'number'], // the number of y-axis ticks
    yax_format: [null, 'function'], // a function that formats the y-axis' labels
    yax_tick_length: [5, 'number'], // the y-axis' tick length in pixels
    yax_units: ['', 'string'], // a prefix symbol to be shown alongside the y-axis' labels
    yax_units_append: [false, 'boolean'], // determines whether to append rather than prepend units
    // GraphicOptions
    aggregate_rollover: [false, 'boolean'], // links the lines in a multi-line graphic
    animate_on_load: [false, 'boolean'], // determines whether lines are transitioned on first-load
    area: [true, ['boolean', 'array']], // determines whether to fill the area below the line
    flip_area_under_y_value: [null, 'number'], // Specify a Y baseline number value to flip area under it
    baselines: [null, 'object[]'], // horizontal lines that indicate, say, goals.
    chart_type: ['line', ['line', 'histogram', 'point', 'bar', 'missing-data']], // '{line, histogram, point, bar, missing-data}'],
    color: [null, ['string', 'string[]']],
    colors: [null, ['string', 'string[]']],
    custom_line_color_map: [[], 'number[]'], // maps an arbitrary set of lines to colors
    decimals: [2, 'number'], // the number of decimals to show in a rollover
    error: ['', 'string'], // does the graphic have an error that we want to communicate to users
    format: ['count', ['count', 'percentage']], // the format of the data object (count or percentage)
    full_height: [false, 'boolean'], // sets height to that of the parent, adjusts dimensions on window resize
    full_width: [false, 'boolean'], // sets width to that of the parent, adjusts dimensions on window resize
    interpolate: [d3.curveCatmullRom.alpha(0), [d3.curveBasisClosed, d3.curveBasisOpen, d3.curveBasis, d3.curveBundle, d3.curveCardinalClosed, d3.curveCardinalOpen, d3.curveCardinal, d3.curveCatmullRomClosed, d3.curveCatmullRomOpen, d3.curveLinearClosed, d3.curveLinear, d3.curveMonotoneX, d3.curveMonotoneY, d3.curveNatural, d3.curveStep, d3.curveStepAfter, d3.curveStepBefore]], // the interpolation function to use for rendering lines
    legend: ['', 'string[]'], // an array of literals used to label lines
    legend_target: ['', 'string'], // the DOM element to insert the legend in
    linked: [false, 'boolean'], // used to link multiple graphics together
    linked_format: ['%Y-%m-%d', 'string'], // specifies the format of linked rollovers
    list: [false, 'boolean'], // automatically maps the data to x and y accessors
    markers: [null, 'object[]'], // vertical lines that indicate, say, milestones
    max_data_size: [null, 'number'], // for use with custom_line_color_map
    missing_text: [null, 'string'], // The text to display for missing graphics
    show_missing_background: [true, 'boolean'], // Displays a background for missing graphics
    mousemove_align: ['right', 'string'], // implemented in point.js
    x_mouseover: [null, ['string', 'function']],
    y_mouseover: [null, ['string', 'function']],
    mouseover: [null, 'function'], // custom rollover function
    mousemove: [null, 'function'], // custom rollover function
    mouseout: [null, 'function'], // custom rollover function
    click: [null, 'function'],
    point_size: [2.5, 'number'], // the radius of the dots in the scatterplot
    active_point_on_lines: [false, 'boolean'], // if set, active dot on lines will be displayed.
    active_point_accessor: ['active', 'string'], // data accessor value to determine if a point is active or not
    active_point_size: [2, 'number'], // the size of the dot that appears on a line when
    points_always_visible: [false, 'boolean'], //  whether to always display data points and not just on hover
    rollover_time_format: [null, 'string'], // custom time format for rollovers
    show_confidence_band: [null, 'string[]'], // determines whether to show a confidence band
    show_rollover_text: [true, 'boolean'], // determines whether to show text for a data point on rollover
    show_tooltips: [true, 'boolean'], // determines whether to display descriptions in tooltips
    showActivePoint: [true, 'boolean'], // If enabled show active data point information in chart
    target: ['#viz', ['string', HTMLElement]], // the DOM element to insert the graphic in
    transition_on_update: [true, 'boolean'], // gracefully transitions the lines on data change
    x_rug: [false, 'boolean'], // show a rug plot along the x-axis
    y_rug: [false, 'boolean'], // show a rug plot along the y-axis
    mouseover_align: ['right', ['right', 'left']],
    brush: [null, ['xy','x','y']], // add brush function
    brushing_selection_changed: [null, 'function'], // callback function on brushing. the first parameter are the arguments that correspond to this chart, the second parameter is the range of the selection
    zoom_target: [null, 'object'], // the zooming target of brushing function
    click_to_zoom_out: [true, 'boolean'], // if true and the graph is currently zoomed in, clicking on the graph will zoom out
    // Layout
    buffer: [8, 'number'], // the padding around the graphic
    bottom: [45, 'number'], // the size of the bottom margin
    center_title_full_width: [false, 'boolean'], // center title over entire graph
    height: [220, 'number'], // the graphic's height
    left: [50, 'number'], // the size of the left margin
    right: [10, 'number'], // the size of the right margin
    small_height_threshold: [120, 'number'], // maximum height for a small graphic
    small_width_threshold: [160, 'number'], // maximum width for a small graphic
    top: [65, 'number'], // the size of the top margin
    width: [350, 'number'], // the graphic's width
    title_y_position: [10, 'number'], // how many pixels from the top edge (0) should we show the title at
    title: [null, 'string'],
    description: [null, 'string']
  };

  let defaults$1 = options_to_defaults(options);

  function data_graphic(args) {

    call_hook('global.defaults', defaults$1);

    if (!args) { args = {}; }

    for (let key in args) {
      if (!validate_option(options, key, args[key])) {
        if (!(key in options)) {
          console.warn(`Option ${key} not recognized`);
        } else {
          console.warn(`Option ${key} expected type ${MG.options[key][1]} but got ${args[key]} instead`);
        }
      }
    }

    var selected_chart = CHARTS[args.chart_type || defaults$1.chart_type];
    merge_with_defaults(args, selected_chart.defaults, defaults$1);

    if (args.list) {
      args.x_accessor = 0;
      args.y_accessor = 1;
    }

    // check for deprecated parameters
    for (var key in deprecations) {
      if (args.hasOwnProperty(key)) {
        var deprecation = deprecations[key],
          message = 'Use of `args.' + key + '` has been deprecated',
          replacement = deprecation.replacement;

        // transparently alias the deprecated
        if (replacement) {
          if (args[replacement]) {
            message += '. The replacement - `args.' + replacement + '` - has already been defined. This definition will be discarded.';
          } else {
            args[replacement] = args[key];
          }
        }

        if (deprecation.warned) {
          continue;
        }

        deprecation.warned = true;

        if (replacement) {
          message += ' in favor of `args.' + replacement + '`';
        }

        warn_deprecation(message, deprecation.version);
      }
    }

    call_hook('global.before_init', args);

    new selected_chart.descriptor(args);

    return args.data;
  }

  const lib = {
    arr_diff: arr_diff$1,
    convert_range_to_domain,
    convert,
    data_graphic,
    markers: markers$1,
    time_format,
    truncate_text,
    wrap_text,
    zoom_to_data_domain,
    zoom_to_data_range,
    zoom_to_raw_range,
  };

  return lib;

})));
//# sourceMappingURL=metricsgraphics.js.map
