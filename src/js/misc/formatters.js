function format_rollover_number(args) {
  var num;
  if (args.format === 'count') {
    num = function(d_) {
      var is_float = d_ % 1 !== 0;
      var n = d3.format("0,000");
      d_ = is_float ? d3.round(d_, args.decimals) : d_;
      return n(d_);
    };
  } else {
    num = function(d_) {
      var fmt_string = (args.decimals ? '.' + args.decimals : '' ) + '%';
      var n = d3.format(fmt_string);
      return n(d_);
    };
  }
  return num;
}

var time_rollover_format = function (f, d, accessor, utc) {
  var fd;
  if (typeof f === 'string') {
    fd = MG.time_format(utc, f)(d[accessor]);
  } else if (typeof f === 'function') {
    fd = f(d);
  } else {
    fd = d[accessor];
  }
  return fd;
};

// define our rollover format for numbers
var number_rollover_format = function (f, d, accessor) {
  var fd;
  if (typeof f === 'string') {
    fd = d3.format(f)(d[accessor]);
  } else if (typeof f === 'function') {
    fd = f(d);
  } else {
    fd = d[accessor];
  }
  return fd;
};

function mg_format_y_rollover(args, num, d) {
  var formatted_y;
  if (args.y_mouseover !== null) {
    if (args.aggregate_rollover) {
      formatted_y = number_rollover_format(args.y_mouseover, d, args.y_accessor);
    } else {
      formatted_y = number_rollover_format(args.y_mouseover, d, args.y_accessor);
    }
  } else {
    if (args.time_series) {
      if (args.aggregate_rollover) {
        formatted_y = num(d[args.y_accessor]);//number_rollover_format(args.y_rollover_format, d, args.y_accessor);
      } else {
        formatted_y = args.yax_units + num(d[args.y_accessor]);
      }
    }
    else {
      formatted_y = args.y_accessor + ': ' + args.yax_units + num(d[args.y_accessor]);
    }
  }
  return formatted_y;
}

function mg_format_x_rollover(args, fmt, d) {
  var formatted_x;
  if (args.x_mouseover !== null) {
    if (args.time_series) {
      if (args.aggregate_rollover) {
        formatted_x = time_rollover_format(args.x_mouseover, d, 'key', args.utc);
      } else {
        formatted_x = time_rollover_format(args.x_mouseover, d, args.x_accessor, args.utc);
      }
    } else {
      formatted_x = number_rollover_format(args.x_mouseover, d, args.x_accessor);
    }
  } else {
    if (args.time_series) {
    var date;

    if (args.aggregate_rollover && args.data.length > 1) {
      date = new Date(d.key);
    } else {
      date = new Date(+d[args.x_accessor]);
      date.setDate(date.getDate());
    }

    formatted_x = fmt(date) + '  ';
    } else {
      formatted_x = args.x_accessor + ': ' + d[args.x_accessor] + ', ';
    }
  }
  return formatted_x;
}

MG.format_rollover_number = format_rollover_number;
