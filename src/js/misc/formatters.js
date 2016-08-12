function format_rollover_number(args) {
  var num;
  if (args.format === 'count') {
    num = function(d) {
      var is_float = d % 1 !== 0;
      var pf;

      if (is_float) {
        pf = d3.format(',.' + args.decimals + 'f');
      } else {
        pf = d3.format(',.0f');
      }

      // are we adding units after the value or before?
      if (args.yax_units_append) {
        return pf(d) + args.yax_units;
      } else {
        return args.yax_units + pf(d);
      }
    };
  } else {
    num = function(d_) {
      var fmt_string = (args.decimals ? '.' + args.decimals : '') + '%';
      var pf = d3.format(fmt_string);
      return pf(d_);
    };
  }
  return num;
}

var time_rollover_format = function(f, d, accessor, utc) {
  var fd;
  if (typeof f === 'string') {
    fd = MG.time_format(utc, f)(d[accessor]);
  } else if (typeof f === 'function') {
    fd = f(d);
  } else {
    fd = d[accessor];
  }
  return fd;
}

// define our rollover format for numbers
var number_rollover_format = function(f, d, accessor) {
  var fd;
  if (typeof f === 'string') {
    fd = d3.format('s')(d[accessor]);
  } else if (typeof f === 'function') {
    fd = f(d);
  } else {
    fd = d[accessor];
  }
  return fd;
}

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
        formatted_y = num(d[args.y_accessor]);
      } else {
        formatted_y = args.yax_units + num(d[args.y_accessor]);
      }
    } else {
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
      formatted_x = args.x_accessor + ': ' + d[args.x_accessor] + '   ';
    }
  }
  return formatted_x;
}

function mg_format_data_for_mouseover(args, d, mouseover_fcn, accessor, check_time) {
  var formatted_data, formatter;
  var time_fmt = mg_get_rollover_time_format(args);
  if (typeof d[accessor] === 'string') {
    formatter = function(d) {
      return d;
    }
  } else {
    formatter = format_rollover_number(args);
  }

  if (mouseover_fcn !== null) {
    if (check_time) formatted_data = time_rollover_format(mouseover_fcn, d, accessor, args.utc);
    else formatted_data = number_rollover_format(mouseover_fcn, d, accessor);

  } else {
    if (check_time) formatted_data = time_fmt(new Date(+d[accessor])) + '  ';
    else formatted_data = (args.time_series ? '' : accessor + ': ') + formatter(d[accessor]) + '   ';
  }
  return formatted_data;
}

function mg_format_number_mouseover(args, d) {
  return mg_format_data_for_mouseover(args, d, args.x_mouseover, args.x_accessor, false);
}

function mg_format_x_mouseover(args, d) {
  return mg_format_data_for_mouseover(args, d, args.x_mouseover, args.x_accessor, args.time_series);
}

function mg_format_y_mouseover(args, d) {
  return mg_format_data_for_mouseover(args, d, args.y_mouseover, args.y_accessor, false);
}

function mg_format_x_aggregate_mouseover(args, d) {
  return mg_format_data_for_mouseover(args, d, args.x_mouseover, 'key', args.time_series)
}

MG.format_rollover_number = format_rollover_number;
