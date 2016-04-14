//
// scales.js
// ---------
//
// This module will become the home for much of the scale-based logic.
// Over time we will be moving some of the aspects of scale creation
// from y_axis.js and x_axis.js and adapting and generalizing them here.
// With that in mind, y_axis.js and x_axis.js will be concerned chiefly
// with the drawing of the axes.
//


// The axis scales, like x and y, are 1.) numerical, and 2.) positional.
// These two elements are somewhat independent of each other.


/* 

// x_scale variable automatically creates a date-based scale for the x axis.
var x_scale = MGScale(args)
          .namespace('y')
          .numerical('date')  // accessor namespace, the accessor string value to pull. Auto determines if log.
          .position('bottom');

var y_scale = MGScale(args)
          .namespace('y')
          .numerical('y', 'count')
          .position('left');

// so, what do we do for color?
var color_scale = MGScale(args)
        .namespace('color')
        .numerical('rating')        // map color to 
        .range(['red', 'green'])
        .clamp('true');


*/

function mg_position(str, args) {
  if (str === 'bottom' || str === 'top') return [mg_get_plot_left(args), mg_get_plot_right(args)]// - args.additional_buffer];
  if (str === 'left' || str === 'right') return [mg_get_plot_bottom(args), args.top];
}

function MGScale(args){
  // big wrapper around d3 scale that automatically formats & calculates scale bounds
  // according to the data, and handles other niceties.
  var scaleArgs = {}
  scaleArgs.use_inflator = false;
  scaleArgs.zero_bottom = false;
  scaleArgs.scaleType = 'numerical';

  this.namespace = function(_namespace) {
    scaleArgs.namespace               = _namespace;
    scaleArgs.namespace_accessor_name = scaleArgs.namespace + '_accessor';
    scaleArgs.scale_name              = scaleArgs.namespace.toUpperCase();
    scaleArgs.scalefn_name            = scaleArgs.namespace + 'f';
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
    if (arguments.length>0) other_flat_data_arrays = arguments;
    // pull out a non-empty array in args.data.
    var illustrative_data;
    for (var i = 0; i < args.data.length; i++) {
      if (args.data[i].length > 0) illustrative_data = args.data[i];
    }
    scaleArgs.is_time_series = illustrative_data[0][args[scaleArgs.namespace_accessor_name]] instanceof Date ? true : false;

    mg_add_scale_function(args, scaleArgs.scalefn_name, scaleArgs.scale_name, args[scaleArgs.namespace_accessor_name]);

    mg_min_max_numerical(args, scaleArgs, other_flat_data_arrays, scaleArgs.use_inflator);
    
    var time_scale = (args.utc_time) ? d3.time.scale.utc() : d3.time.scale();

    args.scales[scaleArgs.scale_name] = (scaleArgs.is_time_series)
      ? time_scale
      : (args[scaleArgs.namespace +'_scale_type'] === 'log')
          ? d3.scale.log()
          : d3.scale.linear();

    args.scales[scaleArgs.scale_name].domain([args.processed['min_' + scaleArgs.namespace], args.processed['max_'+scaleArgs.namespace]]);
    scaleArgs.scaleType = 'numerical';

    return this;
  }

  this.categoricalDomain = function(domain) {
    args.scales[scaleArgs.scale_name] = d3.scale.ordinal().domain(domain);
    mg_add_scale_function(args, scaleArgs.scalefn_name, scaleArgs.scale_name, args[scaleArgs.namespace_accessor_name]);
    return this;
  }

  this.categoricalDomainFromData = function() {
    // make args.categorical_variables.
    // lets make the categorical variables.
    var all_data =mg_flatten_array(args.data)
    
    //d3.set(data.map(function(d){return d[args.group_accessor]})).values()
    scaleArgs.categoricalVariables = d3.set(all_data.map(function(d){return d[args[scaleArgs.namespace_accessor_name]]})).values();
    args.scales[scaleArgs.scale_name] = d3.scale.ordinal()
      .domain(scaleArgs.categoricalVariables);

    mg_add_scale_function(args, scaleArgs.scalefn_name, scaleArgs.scale_name, args[scaleArgs.namespace_accessor_name]);
    scaleArgs.scaleType = 'categorical';
    return this;
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ////////// all scale ranges are either positional (for axes, etc) or arbitrary (colors, size, etc) //////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////

  this.numericalRange = function(range) {
    if (typeof range === 'string') {
      args.scales[scaleArgs.scale_name].range(mg_position(range, args));  
    } else {
      args.scales[scaleArgs.scale_name].range(range);  
    }
    
    return this;
  }

  this.categoricalRangeBands = function(range) {
    var namespace = scaleArgs.namespace;
    var paddingPercentage = args[namespace +'_padding_percentage'];
    var outerPaddingPercentage = args[namespace +'_outer_padding_percentage'];

    if (typeof range === 'string') {
      // if string, it's a location. Place it accordingly.
      args.scales[scaleArgs.scale_name].rangeBands(mg_position(range, args), paddingPercentage, outerPaddingPercentage);
    } else {
      args.scales[scaleArgs.scale_name].rangeBands(range, paddingPercentage, outerPaddingPercentage);
    }

    return this;
  }

  this.categoricalRange = function(range) {
    // var colorRange = args.scales[scaleArgs.scale_name].domain().length > 10
    //       ? d3.scale.category20() : d3.scale.category10())
    args.scales[scaleArgs.scale_name].range(range);
    return this;
  }

  this.categoricalColorRange = function() {
    args.scales[scaleArgs.scale_name] =    args.scales[scaleArgs.scale_name].domain().length > 10
              ? d3.scale.category20() : d3.scale.category10();
    args.scales[scaleArgs.scale_name].domain(scaleArgs.categoricalVariables);
    return this;
  }

  this.clamp = function(yn) {
    args.scales[scaleArgs.scale_name].clamp(yn);
    return this;
  }

  return this;
}

MG.scale_factory = MGScale;



///////////////////////////////             x,   x_accessor etc.   markers, baselines, etc.
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
      .map(function(dp){return dp[accessor]})
      .concat(mg_flatten_array(additional_data_arrays));  

  // do processing for log ////////////////////////////////////////////////////////////
  if (args[namespace + '_scale_type'] === 'log') {
    all_data = all_data.filter(function (d) {
      return d > 0;
    });
  }
  ////////////////////////////////////////////////////////////////////////////////
  // use inflator?
  var extents = d3.extent(all_data);
  var min_val = extents[0];
  var max_val = extents[1];

  // bolt scale domain to zero when the right conditions are met:
  // not pulling the bottom of the range from data
  // not zero-bottomed
  // not a time series
  if (zero_bottom && !args['min_' + namespace + '_from_data'] && min_val > 0 && !scaleArgs.is_time_series) {
    min_val = args[namespace +'_scale_type'] === 'log' ? 1 : 0;
  }

  if (args[namespace + '_scale_type'] !== 'log' && min_val < 0 && !scaleArgs.is_time_series) {
    min_val = min_val - (min_val - min_val * args.inflator) * use_inflator;
  }

  if (!scaleArgs.is_time_series) {
    max_val = (max_val < 0)
      ? max_val + (max_val - max_val * args.inflator) * use_inflator
      : max_val * (use_inflator ? args.inflator : 1);  
  }

  min_val = args['min_' + namespace]  || min_val;
  max_val = args['max_' + namespace]  || max_val;
  // if there's a single data point, we should custom-set the min and max values.

  if (min_val === max_val && !(args['min_' + namespace] && args['max_' + namespace])) {

    if (min_val instanceof Date) {
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
}





function mg_define_x_scale (args) {
  mg_add_scale_function(args, 'xf', 'X', args.x_accessor);
  mg_find_min_max_x(args);

  var time_scale = (args.utc_time)
    ? d3.time.scale.utc()
    : d3.time.scale();

  args.scales.X = (args.time_series)
    ? time_scale
    : (args.x_scale_type === 'log')
        ? d3.scale.log()
        : d3.scale.linear();

  args.scales.X
    .domain([args.processed.min_x, args.processed.max_x])
    .range([mg_get_plot_left(args), mg_get_plot_right(args) - args.additional_buffer]);

  args.scales.X.clamp(args.x_scale_type === 'log');
}



//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////

function mg_bar_color_scale(args) {
  if (args.color_accessor !== false) {
    if (args.ygroup_accessor) {
      // add a custom accessor element.
      if (args.color_accessor === null) {
        args.color_accessor = args.y_accessor;
      }
      else {

      }
    }
    // get color domain.
    var domain = mg_get_color_domain(args);
    if (args.color_accessor !== null) mg_add_color_categorical_scale(args, domain, args.color_accessor);
  }
}

function mg_add_color_categorical_scale(args, domain, accessor) {
  args.scales.color = d3.scale.category20().domain(domain);
  args.scalefns.color = function(d){return args.scales.color(d[accessor])};
}
  
function mg_get_categorical_domain (data, accessor) {
  return d3.set(data.map(function (d) { return d[accessor]; }))
        .values();
}

function mg_get_color_domain (args) {
  var color_domain;
  if (args.color_domain === null) {
    if (args.color_type === 'number') {
      color_domain = d3.extent(args.data[0],function(d){return d[args.color_accessor];});
    }
    else if (args.color_type === 'category') {
      color_domain = mg_get_categorical_domain(args.data[0], args.color_accessor);

    }
  } else {
    color_domain = args.color_domain;
  }
  return color_domain;
}



function mg_get_color_range (args) {
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