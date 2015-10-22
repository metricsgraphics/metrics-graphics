function y_rug(args) {
    'use strict';
    var svg = mg_get_svg_child_of(args.target);

    var buffer_size = args.chart_type === 'point'
        ? args.buffer / 2
        : args.buffer * 2 / 3;

    var all_data = [];
    for (var i = 0; i < args.data.length; i++) {
        for (var j = 0; j < args.data[i].length; j++) {
            all_data.push(args.data[i][j]);
        }
    }

    var rug = svg.selectAll('line.mg-y-rug').data(all_data);

    //set the attributes that do not change after initialization, per
    //D3's general update pattern
    rug.enter().append('svg:line')
        .attr('class', 'mg-y-rug')
        .attr('opacity', 0.3);

    //remove rug elements that are no longer in use
    rug.exit().remove();

    //set coordinates of new rug elements
    rug.exit().remove();

    rug.attr('x1', args.left + 1)
        .attr('x2', args.left+buffer_size)
        .attr('y1', args.scalefns.yf)
        .attr('y2', args.scalefns.yf);

    if (args.color_accessor) {
        rug.attr('stroke', args.scalefns.color);
        rug.classed('mg-y-rug-mono', false);
    } else {
        rug.attr('stroke', null);
        rug.classed('mg-y-rug-mono', true);
    }
}

MG.y_rug = y_rug;

function y_axis(args) {
    if (!args.processed) {
        args.processed = {};
    }

    var svg = mg_get_svg_child_of(args.target);

    var g;
    var min_y;
    var max_y;

    args.scalefns.yf = function(di) {
        return args.scales.Y(di[args.y_accessor]);
    };

    var _set = false;

    var gtZeroFilter = function(d) {
        return d[args.y_accessor] > 0;
    };

    var mapToY = function(d) {
        return d[args.y_accessor];
    };

    //get min_y and max_y from data
    for (var i = 0; i < args.data.length; i++) {
        var a = args.data[i];

        if (args.y_scale_type === 'log') {
            // filter positive values
            a = a.filter(gtZeroFilter);
        }

        //get min/max in one pass, consider baselines to be part of data
        if (a.length > 0) { 
            if (args.baselines) {
                a = a.concat(args.baselines);
            }

            var extent = d3.extent(a, mapToY);

            if (!_set) {
                // min_y and max_y haven't been set
                min_y = extent[0];
                max_y = extent[1];
                _set = true;
            } else {
                min_y = Math.min(extent[0], min_y);
                max_y = Math.max(extent[1], max_y);
            }
        }
    }

    //the default case is for the y-axis to start at 0, unless we explicitly want it
    //to start at an arbitrary number or from the data's minimum value
    if (min_y >= 0 && !args.min_y && !args.min_y_from_data) {
        min_y = 0;
    }

    if (args.chart_type === 'bar') {
        min_y = 0;
        max_y = d3.max(args.data[0], function(d) {
            var trio = [];
            trio.push(d[args.y_accessor]);

            if (args.baseline_accessor !== null) {
                trio.push(d[args.baseline_accessor]);
            }

            if (args.predictor_accessor !== null) {
                trio.push(d[args.predictor_accessor]);
            }

            return Math.max.apply(null, trio);
        });
    }

    //if a min_y or max_y has been set, use those instead
    min_y = (args.min_y !== null)
        ? args.min_y
        : min_y;

    max_y = (args.max_y !== null)
        ? args.max_y
        : (max_y < 0)
            ? max_y + (max_y - max_y * args.inflator)
            : max_y * args.inflator;

    if (args.y_scale_type !== 'log' && min_y < 0) {
        min_y = min_y  - (min_y - min_y * args.inflator);
    }

    if (!args.min_y && args.min_y_from_data) {
        min_y = min_y / args.inflator;
    }

    args.processed.min_y = min_y;
    args.processed.max_y = max_y;

    MG.call_hook('y_axis.process_min_max', args, min_y, max_y);
    min_y = args.processed.min_y;
    max_y = args.processed.max_y;

    if (args.y_scale_type === 'log') {
        if (args.chart_type === 'histogram') {
            // log histogram plots should start just below 1
            // so that bins with single counts are visible
            min_y = 0.2;
        } else {
            if (min_y <= 0) {
                min_y = 1;
            }
        }
        args.scales.Y = d3.scale.log()
            .domain([min_y, max_y])
            .range([args.height - args.bottom - args.buffer, args.top])
            .clamp(true);
    } else {
        args.scales.Y = d3.scale.linear()
            .domain([min_y, max_y])
            .range([args.height - args.bottom - args.buffer, args.top]);
    }

    //used for ticks and such, and designed to be paired with log or linear
    args.scales.Y_axis = d3.scale.linear()
        .domain([args.processed.min_y, args.processed.max_y])
        .range([args.height - args.bottom - args.buffer, args.top]);

    var yax_format = args.yax_format;
    if (!yax_format) {
        if (args.format === 'count') {
            //increase decimals if we have small values, useful for realtime data
            if (max_y < 0.0001) {
                args.decimals = 6;
            } else if (max_y < 0.1) {
                args.decimals = 4;
            }

            yax_format = function(f) {
                if (f < 1.0) {
                    // Don't scale tiny values.
                    return args.yax_units + d3.round(f, args.decimals);
                } else {
                    var pf = d3.formatPrefix(f);
                    return args.yax_units + pf.scale(f) + pf.symbol;
                }
            };
        } else { //percentage
            yax_format = function(d_) {
                var n = d3.format('2p');
                return n(d_);
            };
        }
    }

    //remove the old y-axis, add new one
    svg.selectAll('.mg-y-axis').remove();

    if (!args.y_axis) {
        return this;
    }

    //y axis
    g = svg.append('g')
        .classed('mg-y-axis', true)
        .classed('mg-y-axis-small', args.use_small_class);

    //are we adding a label?
    if (args.y_label) {
        g.append('text')
            .attr('class', 'label')
            .attr('x', function() {
                return -1 * (args.top + args.buffer +
                        ((args.height - args.bottom - args.buffer)
                            - (args.top + args.buffer)) / 2);
            })
            .attr('y', function() {
                return args.left / 2;
            })
            .attr("dy", "0.4em")
            .attr('text-anchor', 'middle')
            .text(function(d) {
                return args.y_label;
            })
            .attr("transform", function(d) {
                return "rotate(-90)";
            });
    }

    var scale_ticks = args.scales.Y.ticks(args.yax_count);

    function log10(val) {
         if (val === 1000) {
            return 3;
         }
         if (val === 1000000) {
            return 7;
         }
         return Math.log(val) / Math.LN10;
    }

    if (args.y_scale_type === 'log') {
        // get out only whole logs
        scale_ticks = scale_ticks.filter(function(d) {
            return Math.abs(log10(d)) % 1 < 1e-6 || Math.abs(log10(d)) % 1 > 1-1e-6;
        });
    }

    //filter out fraction ticks if our data is ints and if ymax > number of generated ticks
    var number_of_ticks = args.scales.Y.ticks(args.yax_count).length;

    //is our data object all ints?
    var data_is_int = true;
    args.data.forEach(function(d, i) {
        d.forEach(function(d, i) {
            if (d[args.y_accessor] % 1 !== 0) {
                data_is_int = false;
                return false;
            }
        });
    });

    if (data_is_int && number_of_ticks > max_y && args.format === 'count') {
        //remove non-integer ticks
        scale_ticks = scale_ticks.filter(function(d) {
            return d % 1 === 0;
        });
    }

    //add the y-axis line; if we have 0s hide the line
    var tick_length = scale_ticks.length;
    if (!args.x_extended_ticks && !args.y_extended_ticks && tick_length) {
        var y1scale, y2scale;

        if (args.axes_not_compact && args.chart_type !== 'bar') {
            y1scale = args.height - args.bottom;
            y2scale = args.top;
        } else if (tick_length) {
            y1scale = args.scales.Y(scale_ticks[0]).toFixed(2);
            y2scale = args.scales.Y(scale_ticks[tick_length - 1]).toFixed(2);
        } else {
            y1scale = 0;
            y2scale = 0;
        }

        g.append('line')
            .attr('x1', args.left)
            .attr('x2', args.left)
            .attr('y1', y1scale)
            .attr('y2', y2scale);
    }

    //add y ticks
    g.selectAll('.mg-yax-ticks')
        .data(scale_ticks).enter()
            .append('line')
                .classed('mg-extended-y-ticks', args.y_extended_ticks)
                .attr('x1', args.left)
                .attr('x2', function() {
                    return (args.y_extended_ticks)
                        ? args.width - args.right
                        : args.left - args.yax_tick_length;
                })
                .attr('y1', function(d) { return args.scales.Y(d).toFixed(2); })
                .attr('y2', function(d) { return args.scales.Y(d).toFixed(2); });

    g.selectAll('.mg-yax-labels')
        .data(scale_ticks).enter()
            .append('text')
                .attr('x', args.left - args.yax_tick_length * 3 / 2)
                .attr('dx', -3).attr('y', function(d) {
                    return args.scales.Y(d).toFixed(2);
                })
                .attr('dy', '.35em')
                .attr('text-anchor', 'end')
                .text(function(d) {
                    var o = yax_format(d);
                    return o;
                });

    if (args.y_rug) {
        y_rug(args);
    }

    return this;
}

MG.y_axis = y_axis;

function y_axis_categorical(args) {
    // first, come up with y_axis
    args.scales.Y = d3.scale.ordinal()
        .domain(args.categorical_variables)
        .rangeRoundBands([args.height - args.bottom - args.buffer, args.top], args.padding_percentage, args.outer_padding_percentage);

    args.scalefns.yf = function(di) {
        return args.scales.Y(di[args.y_accessor]);
    };

    var svg = mg_get_svg_child_of(args.target);

    //remove the old y-axis, add new one
    svg.selectAll('.mg-y-axis').remove();

    var g = svg.append('g')
        .classed('mg-y-axis', true)
        .classed('mg-y-axis-small', args.use_small_class);

    if (!args.y_axis) {
        return this;
    }

    var labels = g.selectAll('text').data(args.categorical_variables).enter().append('svg:text')
        .attr('x', args.left)
        .attr('y', function(d) {
            return args.scales.Y(d) + args.scales.Y.rangeBand() / 2
                + (args.buffer)*args.outer_padding_percentage;
        })
        .attr('dy', '.35em')
        .attr('text-anchor', 'end')
        .text(String);

    if (args.rotate_y_labels) {
        labels.attr({
            dy: 0,
            transform: function() {
                var elem = d3.select(this);
                return 'rotate('+args.rotate_y_labels+' '+elem.attr('x')+','+elem.attr('y')+')';
            }
        });
    }

    return this;
}

MG.y_axis_categorical = y_axis_categorical;
