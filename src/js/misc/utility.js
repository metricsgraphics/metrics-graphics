//a set of helper functions, some that we've written, others that we've borrowed
import { is_date, is_object } from './types.js';

export const convert = {
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

export function time_format(utc, specifier) {
  return utc ? d3.utcFormat(specifier) : d3.timeFormat(specifier);
}

export function mg_data_in_plot_bounds(datum, args) {
  return datum[args.x_accessor] >= args.processed.min_x &&
    datum[args.x_accessor] <= args.processed.max_x &&
    datum[args.y_accessor] >= args.processed.min_y &&
    datum[args.y_accessor] <= args.processed.max_y;
}

export function pluck(arr, accessor) {
  return arr.map(function(d) {
    return d[accessor]; });
}

export function count_array_elements(arr) {
  return arr.reduce(function(a, b) { a[b] = a[b] + 1 || 1;
    return a; }, {});
}

export function mg_get_bottom(args) {
  return args.height - args.bottom;
}

export function mg_get_plot_bottom(args) {
  // returns the pixel location of the bottom side of the plot area.
  return mg_get_bottom(args) - args.buffer;
}

export function mg_get_top(args) {
  return args.top;
}

export function mg_get_plot_top(args) {
  // returns the pixel location of the top side of the plot area.
  return mg_get_top(args) + args.buffer;
}

export function mg_get_left(args) {
  return args.left;
}

export function mg_get_plot_left(args) {
  // returns the pixel location of the left side of the plot area.
  return mg_get_left(args) + args.buffer;
}

export function mg_get_right(args) {
  return args.width - args.right;
}

export function mg_get_plot_right(args) {
  // returns the pixel location of the right side of the plot area.
  return mg_get_right(args) - args.buffer;
}

//////// adding elements, removing elements /////////////

export function mg_exit_and_remove(elem) {
  elem.exit().remove();
}

export function mg_selectAll_and_remove(svg, cl) {
  svg.selectAll(cl).remove();
}

export function mg_add_g(svg, cl) {
  return svg.append('g').classed(cl, true);
}

export function mg_remove_element(svg, elem) {
  svg.select(elem).remove();
}

//////// axis helper functions ////////////

export function mg_make_rug(args, rug_class) {
  var svg = mg_get_svg_child_of(args.target);
  var all_data = mg_flatten_array(args.data);
  var rug = svg.selectAll('line.' + rug_class).data(all_data);

  rug.enter()
    .append('line')
      .attr('class', rug_class)
      .attr('opacity', 0.3);

  //remove rug elements that are no longer in use
  mg_exit_and_remove(rug);

  //set coordinates of new rug elements
  mg_exit_and_remove(rug);
  return rug;
}

export function mg_add_color_accessor_to_rug(rug, args, rug_mono_class) {
  if (args.color_accessor) {
    rug.attr('stroke', args.scalefns.colorf);
    rug.classed(rug_mono_class, false);
  } else {
    rug.attr('stroke', null);
    rug.classed(rug_mono_class, true);
  }
}

export function mg_rotate_labels(labels, rotation_degree) {
  if (rotation_degree) {
    labels.attr({
      dy: 0,
      transform: function() {
        var elem = d3.select(this);
        return 'rotate(' + rotation_degree + ' ' + elem.attr('x') + ',' + elem.attr('y') + ')';
      }
    });
  }
}

//////////////////////////////////////////////////

export function mg_elements_are_overlapping(labels) {
  labels = labels.node();
  if (!labels) {
    return false;
  }

  for (var i = 0; i < labels.length; i++) {
    if (mg_is_horizontally_overlapping(labels[i], labels)) return true;
  }

  return false;
}

export function mg_prevent_horizontal_overlap(labels, args) {
  if (!labels || labels.length == 1) {
    return;
  }

  //see if each of our labels overlaps any of the other labels
  for (var i = 0; i < labels.length; i++) {
    //if so, nudge it up a bit, if the label it intersects hasn't already been nudged
    if (mg_is_horizontally_overlapping(labels[i], labels)) {
      var node = d3.select(labels[i]);
      var newY = +node.attr('y');
      if (newY + 8 >= args.top) {
        newY = args.top - 16;
      }
      node.attr('y', newY);
    }
  }
}

export function mg_prevent_vertical_overlap(labels, args) {
  if (!labels || labels.length == 1) {
    return;
  }

  labels.sort(function(b, a) {
    return d3.select(a).attr('y') - d3.select(b).attr('y');
  });

  labels.reverse();

  var overlap_amount, label_i, label_j;

  //see if each of our labels overlaps any of the other labels
  for (var i = 0; i < labels.length; i++) {
    //if so, nudge it up a bit, if the label it intersects hasn't already been nudged
    label_i = d3.select(labels[i]).text();

    for (var j = 0; j < labels.length; j++) {
      label_j = d3.select(labels[j]).text();
      overlap_amount = mg_is_vertically_overlapping(labels[i], labels[j]);

      if (overlap_amount !== false && label_i !== label_j) {
        var node = d3.select(labels[i]);
        var newY = +node.attr('y');
        newY = newY + overlap_amount;
        node.attr('y', newY);
      }
    }
  }
}

export function mg_is_vertically_overlapping(element, sibling) {
  var element_bbox = element.getBoundingClientRect();
  var sibling_bbox = sibling.getBoundingClientRect();

  if (element_bbox.top <= sibling_bbox.bottom && element_bbox.top >= sibling_bbox.top) {
    return sibling_bbox.bottom - element_bbox.top;
  }

  return false;
}

export function mg_is_horiz_overlap(element, sibling) {
  var element_bbox = element.getBoundingClientRect();
  var sibling_bbox = sibling.getBoundingClientRect();

  if (element_bbox.right >= sibling_bbox.left || element_bbox.top >= sibling_bbox.top) {
    return sibling_bbox.bottom - element_bbox.top;
  }
  return false;
}

export function mg_is_horizontally_overlapping(element, labels) {
  var element_bbox = element.getBoundingClientRect();

  for (var i = 0; i < labels.length; i++) {
    if (labels[i] == element) {
      continue;
    }

    //check to see if this label overlaps with any of the other labels
    var sibling_bbox = labels[i].getBoundingClientRect();
    if (element_bbox.top === sibling_bbox.top &&
      !(sibling_bbox.left > element_bbox.right || sibling_bbox.right < element_bbox.left)
    ) {
      return true;
    }
  }

  return false;
}

export function mg_infer_type(args, ns) {
    // must return categorical or numerical.
    var testPoint = mg_flatten_array(args.data);

    testPoint = testPoint[0][args[ns + '_accessor']];
    return typeof testPoint === 'string' ? 'categorical' : 'numerical';
}

export function mg_get_svg_child_of(selector_or_node) {
  return d3.select(selector_or_node).select('svg');
}

export function mg_flatten_array(arr) {
  var flat_data = [];
  return flat_data.concat.apply(flat_data, arr);
}

export function mg_next_id() {
  if (typeof MG._next_elem_id === 'undefined') {
    MG._next_elem_id = 0;
  }

  return 'mg-' + (MG._next_elem_id++);
}

export function mg_target_ref(target) {
  if (typeof target === 'string') {
    return mg_normalize(target);

  } else if (target instanceof window.HTMLElement) {
    var target_ref = target.getAttribute('data-mg-uid');
    if (!target_ref) {
      target_ref = mg_next_id();
      target.setAttribute('data-mg-uid', target_ref);
    }

    return target_ref;

  } else {
    console.warn('The specified target should be a string or an HTMLElement.', target);
    return mg_normalize(target);
  }
}

export function mg_normalize(string) {
  return string
    .replace(/[^a-zA-Z0-9 _-]+/g, '')
    .replace(/ +?/g, '');
}

function get_pixel_dimension(target, dimension) {
  return Number(d3.select(target).style(dimension).replace(/px/g, ''));
}

export function get_width(target) {
  return get_pixel_dimension(target, 'width');
}

export function get_height(target) {
  return get_pixel_dimension(target, 'height');
}

// deep copy
// http://stackoverflow.com/questions/728360/most-elegant-way-to-clone-a-javascript-object
export function clone(obj) {
  var copy;

  // Handle the 3 simple types, and null or undefined
  if (null === obj || "object" !== typeof obj) return obj;

  // Handle Date
  if (is_date(obj)) {
    copy = new Date();
    copy.setTime(obj.getTime());
    return copy;
  }

  // Handle Array
  if (Array.isArray(obj)) {
    copy = [];
    for (var i = 0, len = obj.length; i < len; i++) {
      copy[i] = clone(obj[i]);
    }
    return copy;
  }

  // Handle Object
  if (is_object(obj)) {
    copy = {};
    for (var attr in obj) {
      if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
    }
    return copy;
  }

  throw new Error("Unable to copy obj! Its type isn't supported.");
}

// give us the difference of two int arrays
// http://radu.cotescu.com/javascript-diff-function/
export function arr_diff(a, b) {
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
  Print warning message to the console when a feature has been scheduled for removal

  @author Dan de Havilland (github.com/dandehavilland)
  @date 2014-12
*/
export function warn_deprecation(message, untilVersion) {
  console.warn('Deprecation: ' + message + (untilVersion ? '. This feature will be removed in ' + untilVersion + '.' : ' the near future.'));
  console.trace();
}

/**
  Truncate a string to fit within an SVG text node
  CSS text-overlow doesn't apply to SVG <= 1.2

  @author Dan de Havilland (github.com/dandehavilland)
  @date 2014-12-02
*/
export function truncate_text(textObj, textString, width) {
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
export function wrap_text(text, width, token, tspanAttrs) {
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
