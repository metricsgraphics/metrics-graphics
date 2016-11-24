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

function mg_cat_position(str, args) {
  if (str === 'bottom' || str === 'top') {
    return [mg_get_plot_left(args), mg_get_plot_right(args)]
  }

  if (str === 'left' || str === 'right') {
    return [mg_get_plot_bottom(args), mg_get_plot_top(args)];
  }
}

function MGScale(args) {
  // big wrapper around d3 scale that automatically formats & calculates scale bounds
  // according to the data, and handles other niceties.
  var scaleArgs = {}
  scaleArgs.use_inflator = false;
  scaleArgs.zero_bottom = false;
  scaleArgs.scaleType = 'numerical';

  this.namespace = function(_namespace) {
    scaleArgs.namespace = _namespace;
    scaleArgs.namespace_accessor_name = scaleArgs.namespace + '_accessor';
    scaleArgs.scale_name = scaleArgs.namespace.toUpperCase();
    scaleArgs.scalefn_name = scaleArgs.namespace + 'f';
    return this;
  }

  this.scaleName = function(scaleName) {
    scaleArgs.scale_name = scaleName.toUpperCase();
    scaleArgs.scalefn_name = scaleName +'f';
    return this;
  }

  this.inflateDomain = function(tf) {
    scaleArgs.use_inflator = tf;
    return this;
  }

  this.zeroBottom = function(tf) {
    scaleArgs.zero_bottom = tf;
    return this;
  }

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
      : (args[scaleArgs.namespace + '_scale_type'] === 'log')
        ? d3.scaleLog()
        : d3.scaleLinear();

    args.scales[scaleArgs.scale_name].domain([args.processed['min_' + scaleArgs.namespace], args.processed['max_' + scaleArgs.namespace]]);
    scaleArgs.scaleType = 'numerical';

    return this;
  }

  this.categoricalDomain = function(domain) {
    args.scales[scaleArgs.scale_name] = d3.scaleOrdinal().domain(domain);
    mg_add_scale_function(args, scaleArgs.scalefn_name, scaleArgs.scale_name, args[scaleArgs.namespace_accessor_name]);
    return this;
  }

  this.categoricalDomainFromData = function() {
    // make args.categorical_variables.
    // lets make the categorical variables.
    var all_data = mg_flatten_array(args.data)
    //d3.set(data.map(function(d){return d[args.group_accessor]})).values()
    scaleArgs.categoricalVariables = d3.set(all_data.map(function(d) {
      return d[args[scaleArgs.namespace_accessor_name]] })).values();
    args.scales[scaleArgs.scale_name] = d3.scaleBand()
      .domain(scaleArgs.categoricalVariables);

    scaleArgs.scaleType = 'categorical';
    return this;
  }

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
  }

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
  }

  this.categoricalRange = function(range) {
    args.scales[scaleArgs.scale_name].range(range);
    mg_add_scale_function(args, scaleArgs.scalefn_name, scaleArgs.scale_name, args[scaleArgs.namespace_accessor_name]);
    return this;
  }

  this.categoricalColorRange = function() {
    args.scales[scaleArgs.scale_name] = args.scales[scaleArgs.scale_name].domain().length > 10
      ? d3.scaleOrdinal(d3.schemeCategory20)
      : d3.scaleOrdinal(d3.schemeCategory10);

    args
      .scales[scaleArgs.scale_name]
      .domain(scaleArgs.categoricalVariables);

    mg_add_scale_function(args, scaleArgs.scalefn_name, scaleArgs.scale_name, args[scaleArgs.namespace_accessor_name]);
    return this;
  }

  this.clamp = function(yn) {
    args.scales[scaleArgs.scale_name].clamp(yn);
    return this;
  }

  return this;
}

MG.scale_factory = MGScale;

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
      return dp[accessor] })
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

  min_val = args['min_' + namespace] || min_val;
  max_val = args['max_' + namespace] || max_val;
  // if there's a single data point, we should custom-set the min and max values.

  if (min_val === max_val && !(args['min_' + namespace] && args['max_' + namespace])) {

    if (mg_is_date(min_val)) {
      max_val = new Date(MG.clone(min_val).setDate(min_val.getDate() + 1));
      min_val = new Date(MG.clone(min_val).setDate(min_val.getDate() - 1));
    } else if (typeof min_val === 'number') {
      min_val = min_val - 1;
      max_val = min_val + 1;
      mg_force_xax_count_to_be_two(args);
    }
  }

  args.processed['min_' + namespace] = min_val;
  args.processed['max_' + namespace] = max_val;

  MG.call_hook('x_axis.process_min_max', args, args.processed.min_x, args.processed.max_x);
  MG.call_hook('y_axis.process_min_max', args, args.processed.min_y, args.processed.max_y);
}

function mg_categorical_group_color_scale(args) {
  if (args.color_accessor !== false) {
    if (args.ygroup_accessor) {
      // add a custom accessor element.
      if (args.color_accessor === null) {
        args.color_accessor = args.y_accessor;
      } else {}
    }
    if (args.color_accessor !== null) {
      new MG.scale_factory(args)
        .namespace('color')
        .categoricalDomainFromData()
        .categoricalColorRange();
    }
  }
}

function mg_add_color_categorical_scale(args, domain, accessor) {
  args.scales.color = d3.scaleOrdinal(d3.schemeCategory20).domain(domain);
  args.scalefns.color = function(d) {
    return args.scales.color(d[accessor]);
  };
}

function mg_get_categorical_domain(data, accessor) {
  return d3.set(data.map(function(d) {
      return d[accessor]; }))
    .values();
}

function mg_get_color_domain(args) {
  var color_domain;
  if (args.color_domain === null) {
    if (args.color_type === 'number') {
      color_domain = d3.extent(args.data[0], function(d) {
        return d[args.color_accessor]; });
    } else if (args.color_type === 'category') {
      color_domain = mg_get_categorical_domain(args.data[0], args.color_accessor);

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
