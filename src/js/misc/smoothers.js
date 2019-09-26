function add_ls(args) {
  var svg = mg_get_svg_child_of(args.target);
  var data = args.data[0];
  var min_x = d3.min(data, function(d) {
    return d[args.x_accessor]; });
  var max_x = d3.max(data, function(d) {
    return d[args.x_accessor]; });

  d3.select(args.target).selectAll('.mg-least-squares-line').remove();

  svg.append('svg:line')
    .attr('x1', args.scales.X(min_x))
    .attr('x2', args.scales.X(max_x))
    .attr('y1', args.scales.Y(args.ls_line.fit(min_x)))
    .attr('y2', args.scales.Y(args.ls_line.fit(max_x)))
    .attr('class', 'mg-least-squares-line');
}

MG.add_ls = add_ls;

function add_lowess(args) {
  var svg = mg_get_svg_child_of(args.target);
  var lowess = args.lowess_line;

  var line = d3.svg.line()
    .x(function(d) {
      return args.scales.X(d.x); })
    .y(function(d) {
      return args.scales.Y(d.y); })
    .interpolate(args.interpolate);

  svg.append('path')
    .attr('d', line(lowess))
    .attr('class', 'mg-lowess-line');
}

MG.add_lowess = add_lowess;

function lowess_robust(x, y, alpha, inc) {
  // Used http://www.unc.edu/courses/2007spring/biol/145/001/docs/lectures/Oct27.html
  // for the clear explanation of robust lowess.

  // calculate the the first pass.
  var _l;
  var r = [];
  var yhat = d3.mean(y);
  var i;
  for (i = 0; i < x.length; i += 1) { r.push(1); }
  _l = _calculate_lowess_fit(x, y, alpha, inc, r);
  var x_proto = _l.x;
  var y_proto = _l.y;

  // Now, take the fit, recalculate the weights, and re-run LOWESS using r*w instead of w.

  for (i = 0; i < 100; i += 1) {
    r = d3.zip(y_proto, y).map(function(yi) {
      return Math.abs(yi[1] - yi[0]);
    });

    var q = d3.quantile(r.sort(), 0.5);

    r = r.map(function(ri) {
      return _bisquare_weight(ri / (6 * q));
    });

    _l = _calculate_lowess_fit(x, y, alpha, inc, r);
    x_proto = _l.x;
    y_proto = _l.y;
  }

  return d3.zip(x_proto, y_proto).map(function(d) {
    var p = {};
    p.x = d[0];
    p.y = d[1];
    return p;
  });
}

MG.lowess_robust = lowess_robust;

function lowess(x, y, alpha, inc) {
  var r = [];
  for (var i = 0; i < x.length; i += 1) { r.push(1); }
  var _l = _calculate_lowess_fit(x, y, alpha, inc, r);
}

MG.lowess = lowess;

function least_squares(x_, y_) {
  var x, y, xi, yi,
    _x = 0,
    _y = 0,
    _xy = 0,
    _xx = 0;

  var n = x_.length;
  if (mg_is_date(x_[0])) {
    x = x_.map(function(d) {
      return d.getTime();
    });
  } else {
    x = x_;
  }

  if (mg_is_date(y_[0])) {
    y = y_.map(function(d) {
      return d.getTime();
    });
  } else {
    y = y_;
  }

  var xhat = d3.mean(x);
  var yhat = d3.mean(y);
  var numerator = 0,
    denominator = 0;

  for (var i = 0; i < x.length; i++) {
    xi = x[i];
    yi = y[i];
    numerator += (xi - xhat) * (yi - yhat);
    denominator += (xi - xhat) * (xi - xhat);
  }

  var beta = numerator / denominator;
  var x0 = yhat - beta * xhat;

  return {
    x0: x0,
    beta: beta,
    fit: function(x) {
      return x0 + x * beta;
    }
  };
}

MG.least_squares = least_squares;

function _pow_weight(u, w) {
  if (u >= 0 && u <= 1) {
    return Math.pow(1 - Math.pow(u, w), w);
  } else {
    return 0;
  }
}

function _bisquare_weight(u) {
  return _pow_weight(u, 2);
}

function _tricube_weight(u) {
  return _pow_weight(u, 3);
}

function _neighborhood_width(x0, xis) {
  return Array.max(xis.map(function(xi) {
    return Math.abs(x0 - xi);
  }));
}

function _manhattan(x1, x2) {
  return Math.abs(x1 - x2);
}

function _weighted_means(wxy) {
  var wsum = d3.sum(wxy.map(function(wxyi) {
    return wxyi.w; }));

  return {
    xbar: d3.sum(wxy.map(function(wxyi) {
      return wxyi.w * wxyi.x;
    })) / wsum,
    ybar: d3.sum(wxy.map(function(wxyi) {
      return wxyi.w * wxyi.y;
    })) / wsum
  };
}

function _weighted_beta(wxy, xbar, ybar) {
  var num = d3.sum(wxy.map(function(wxyi) {
    return Math.pow(wxyi.w, 2) * (wxyi.x - xbar) * (wxyi.y - ybar);
  }));

  var denom = d3.sum(wxy.map(function(wxyi) {
    return Math.pow(wxyi.w, 2) * Math.pow(wxyi.x - xbar, 2);
  }));

  return num / denom;
}

function _weighted_least_squares(wxy) {
  var ybar, xbar, beta_i, x0;

  var _wm = _weighted_means(wxy);

  xbar = _wm.xbar;
  ybar = _wm.ybar;

  var beta = _weighted_beta(wxy, xbar, ybar);

  return {
    beta: beta,
    xbar: xbar,
    ybar: ybar,
    x0: ybar - beta * xbar

  };
}

function _calculate_lowess_fit(x, y, alpha, inc, residuals) {
  // alpha - smoothing factor. 0 < alpha < 1/
  //
  //
  var k = Math.floor(x.length * alpha);

  var sorted_x = x.slice();

  sorted_x.sort(function(a, b) {
    if (a < b) {
      return -1; } else if (a > b) {
      return 1; }

    return 0;
  });

  var x_max = d3.quantile(sorted_x, 0.98);
  var x_min = d3.quantile(sorted_x, 0.02);

  var xy = d3.zip(x, y, residuals).sort();

  var size = Math.abs(x_max - x_min) / inc;

  var smallest = x_min;
  var largest = x_max;
  var x_proto = d3.range(smallest, largest, size);

  var xi_neighbors;
  var x_i, beta_i, x0_i, delta_i, xbar, ybar;

  // for each prototype, find its fit.
  var y_proto = [];

  for (var i = 0; i < x_proto.length; i += 1) {
    x_i = x_proto[i];

    // get k closest neighbors.
    xi_neighbors = xy.map(function(xyi) {
      return [
        Math.abs(xyi[0] - x_i),
        xyi[0],
        xyi[1],
        xyi[2]
      ];
    }).sort().slice(0, k);

    // Get the largest distance in the neighbor set.
    delta_i = d3.max(xi_neighbors)[0];

    // Prepare the weights for mean calculation and WLS.

    xi_neighbors = xi_neighbors.map(function(wxy) {
      return {
        w: _tricube_weight(wxy[0] / delta_i) * wxy[3],
        x: wxy[1],
        y: wxy[2]
      };
    });

    // Find the weighted least squares, obviously.
    var _output = _weighted_least_squares(xi_neighbors);

    x0_i = _output.x0;
    beta_i = _output.beta;

    //
    y_proto.push(x0_i + beta_i * x_i);
  }

  return { x: x_proto, y: y_proto };
}
