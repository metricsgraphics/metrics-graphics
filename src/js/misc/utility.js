//a set of helper functions, some that we've written, others that we've borrowed

MG.convert = {};

MG.convert.date = function(data, accessor, time_format) {
    time_format = (typeof time_format === "undefined") ? '%Y-%m-%d' : time_format;
    data = data.map(function(d) {
        var fff = d3.time.format(time_format);
        d[accessor] = fff.parse(d[accessor]);
        return d;
    });

    return data;
};

MG.convert.number = function(data, accessor) {
    data = data.map(function(d) {
        d[accessor] = Number(d[accessor]);
        return d;
    });

    return data;
};

function mg_get_svg_child_of(selector_or_node) {
    return d3.select(selector_or_node).select('svg');
}

function mg_strip_punctuation(s) {
    var punctuationless = s.replace(/[^a-zA-Z0-9 _]+/g, '');
    var finalString = punctuationless.replace(/ +?/g, "");
    return finalString;
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

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

var each = function(obj, iterator, context) {
    // yanked out of underscore
    if (obj === null) return obj;
    if (Array.prototype.forEach && obj.forEach === Array.prototype.forEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, length = obj.length; i < length; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var k in obj) {
        if (iterator.call(context, obj[k], k, obj) === breaker) return;
      }
    }

    return obj;
};

function merge_with_defaults(obj) {
    // taken from underscore
    each(Array.prototype.slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] === void 0) obj[prop] = source[prop];
        }
      }
    });

    return obj;
}

function number_of_values(data, accessor, value) {
    var values = data.filter(function(d) {
        return d[accessor] === value;
    });

    return values.length;
}

function has_values_below(data, accessor, value) {
    var values = data.filter(function(d) {
        return d[accessor] <= value;
    });

    return values.length > 0;
}

function has_too_many_zeros(data, accessor, zero_count) {
    return number_of_values(data, accessor, 0) >= zero_count;
}

//deep copy
//http://stackoverflow.com/questions/728360/most-elegant-way-to-clone-a-javascript-object
MG.clone = function(obj) {
    var copy;

    // Handle the 3 simple types, and null or undefined
    if (null === obj || "object" !== typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = MG.clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = MG.clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
};

//give us the difference of two int arrays
//http://radu.cotescu.com/javascript-diff-function/
function arrDiff(a,b) {
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
function warnDeprecation(message, untilVersion) {
  console.warn('Deprecation: ' + message + (untilVersion ? '. This feature will be removed in ' + untilVersion + '.' : ' the near future.'));
  console.trace();
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
function wrapText(text, width, token, tspanAttrs) {
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
