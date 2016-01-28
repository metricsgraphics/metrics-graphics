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

function mg_bar_color_scale(args) {
	// if default args.group_accessor, then add a 
  if (args.color_accessor !== false) {
    if (args.group_accessor) {
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