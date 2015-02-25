function x_rug(args) {
    'use strict';
    var buffer_size = args.chart_type === 'point'
        ? args.buffer / 2
        : args.buffer;

    var svg = mg_get_svg_child_of(args.target);

    var all_data=[];
    for (var i=0; i<args.data.length; i++) {
        for (var j=0; j<args.data[i].length; j++) {
            all_data.push(args.data[i][j]);
        }
    }

    var rug = svg.selectAll('line.mg-x-rug').data(all_data);

    //set the attributes that do not change after initialization, per
    //D3's general update pattern
    rug.enter().append('svg:line')
        .attr('class', 'mg-x-rug')
        .attr('opacity', 0.3);

    //remove rug elements that are no longer in use
    rug.exit().remove();

    //set coordinates of new rug elements
    rug.exit().remove();

    rug.attr('x1', args.scalefns.xf)
        .attr('x2', args.scalefns.xf)
        .attr('y1', args.height-args.top+buffer_size)
        .attr('y2', args.height-args.top);

    if (args.color_accessor) {
        rug.attr('stroke', args.scalefns.color);
        rug.classed('mg-x-rug-mono', false);
    } else {
        rug.attr('stroke', null);
        rug.classed('mg-x-rug-mono', true);
    }
}

function x_axis(args) {
    'use strict';
    var svg = mg_get_svg_child_of(args.target);
    var g;
    var min_x;
    var max_x;

    args.processed = {};

    args.scalefns.xf = function(di) {
        return args.scales.X(di[args.x_accessor]);
    };

    if (args.chart_type === 'point') {
        mg_point_add_color_scale(args);
        mg_point_add_size_scale(args);
    }

    mg_find_min_max_x(args);

    args.scales.X = (args.time_series)
        ? d3.time.scale()
        : d3.scale.linear();
    args.scales.X
        .domain([args.processed.min_x, args.processed.max_x])
        .range([args.left + args.buffer, args.width - args.right - args.buffer - args.additional_buffer]);

    //remove the old x-axis, add new one
    svg.selectAll('.mg-x-axis').remove();

    if (!args.x_axis) {
        return this;
    }

    //x axis
    g = svg.append('g')
        .classed('mg-x-axis', true)
        .classed('mg-x-axis-small', args.use_small_class);

    var last_i = args.scales.X.ticks(args.xax_count).length - 1;

    //are we adding a label?
    if (args.x_label) {
        mg_add_x_label(g, args);
    }

    mg_add_x_ticks(g, args);
    mg_add_x_tick_labels(g, args);

    if (args.x_rug) {
        x_rug(args);
    }

    return this;
}

function x_axis_categorical(args) {
    var svg = mg_get_svg_child_of(args.target);

    var svg_width = args.width,
        additional_buffer = 0;

    if (args.chart_type === 'bar') {
        additional_buffer = args.buffer + 5;
    }

    args.scales.X = d3.scale.ordinal()
        .domain(args.categorical_variables.reverse())
        .rangeRoundBands([args.left, args.width - args.right - args.buffer - additional_buffer]);

    args.scalefns.xf = function(di) {
        return args.scales.X(di[args.x_accessor]);
    };

    //remove the old x-axis, add new one
    svg.selectAll('.mg-x-axis').remove();

    var g = svg.append('g')
        .classed('mg-x-axis', true)
        .classed('mg-x-axis-small', args.use_small_class);

    if (!args.x_axis) {
        return this;
    }

    var labels = g.selectAll('text').data(args.categorical_variables).enter().append('svg:text');

    labels.attr('x', function(d) {
            return args.scales.X(d) + args.scales.X.rangeBand() / 2
                + (args.buffer) * args.outer_padding_percentage + (additional_buffer / 2);
        })
        .attr('y', args.height - args.bottom + args.buffer)
        .attr('dy', '.35em')
        .attr('text-anchor', 'middle')
        .text(String);

    labels.each(function(d, idx) {
        var elem = this,
            width = args.scales.X.rangeBand();
        truncate_text(elem, d, width);
    });

    return this;
}

function mg_point_add_color_scale(args) {
    var min_color, max_color,
        color_domain, color_range;

    if (args.color_accessor !== null) {
        if (args.color_domain === null) {
            if (args.color_type === 'number') {
                min_color = d3.min(args.data[0], function(d) {
                    return d[args.color_accessor];
                });

                max_color = d3.max(args.data[0], function(d) {
                    return d[args.color_accessor];
                });

                color_domain = [min_color, max_color];
            }
            else if (args.color_type === 'category') {
                color_domain = d3.set(args.data[0]
                    .map(function(d) {
                        return d[args.color_accessor];
                    }))
                    .values();

                color_domain.sort();
            }
        } else {
            color_domain = args.color_domain;
        }

        if (args.color_range === null) {
            if (args.color_type === 'number') {
                color_range = ['blue', 'red'];
            } else {
                color_range = null;
            }
        } else {
            color_range = args.color_range;
        }

    if (args.color_type === 'number') {
            args.scales.color = d3.scale.linear()
                .domain(color_domain)
                .range(color_range)
                .clamp(true);
        } else {
            args.scales.color = args.color_range !== null
                ? d3.scale.ordinal().range(color_range)
                : (color_domain.length > 10
                    ? d3.scale.category20() : d3.scale.category10());

            args.scales.color.domain(color_domain);
        }

        args.scalefns.color = function(di) {
            return args.scales.color(di[args.color_accessor]);
        };
    }
}

function mg_point_add_size_scale(args) {
    var min_size, max_size, size_domain, size_range;
    if (args.size_accessor !== null) {
        if (args.size_domain === null) {
            min_size = d3.min(args.data[0], function(d) {
                return d[args.size_accessor];
            });

            max_size = d3.max(args.data[0], function(d) {
                return d[args.size_accessor];
            });

            size_domain = [min_size, max_size];
        } else {
            size_domain = args.size_domain;
        }
        if (args.size_range === null) {
            size_range = [1,5]; //args.size_domain;
        } else {
            size_range = args.size_range;
        }

        args.scales.size = d3.scale.linear()
            .domain(size_domain)
            .range(size_range)
            .clamp(true);

        args.scalefns.size = function(di) {
            return args.scales.size(di[args.size_accessor]);
        };
    }
}

function mg_add_x_label(g, args) {
    g.append('text')
        .attr('class', 'label')
        .attr('x', function() {
            return args.left + args.buffer
                + ((args.width - args.right - args.buffer)
                    - (args.left + args.buffer)) / 2;
        })
        .attr('y', (args.height - args.bottom / 2).toFixed(2))
        .attr('dy', '.50em')
        .attr('text-anchor', 'middle')
        .text(function(d) {
            return args.x_label;
        });
}

function mg_default_bar_xax_format(args) {
    if (args.xax_format) {
        return args.xax_format;
    }

    return function(f) {
        if (f < 1.0) {
            //don't scale tiny values
            return args.xax_units + d3.round(f, args.decimals);
        } else {
            var pf = d3.formatPrefix(f);
            return args.xax_units + pf.scale(f) + pf.symbol;
        }
    };
}

function mg_default_xax_format(args) {
    if (args.xax_format) {
        return args.xax_format;
    }

    var diff,
        main_time_format,
        time_frame;

    if (args.time_series) {
        diff = (args.processed.max_x - args.processed.min_x) / 1000;

        if (diff < 60) {
            main_time_format = d3.time.format('%M:%S');
            time_frame = 'seconds';
        } else if (diff / (60 * 60) <= 24) {
            main_time_format = d3.time.format('%H:%M');
            time_frame = 'less-than-a-day';
        } else if (diff / (60 * 60) <= 24 * 4) {
            main_time_format = d3.time.format('%H:%M');
            time_frame = 'four-days';
        } else {
            main_time_format = d3.time.format('%b %d');
            time_frame = 'default';
        }
    }

    args.processed.main_x_time_format = main_time_format;
    args.processed.x_time_frame = time_frame;

    return function(d) {
        var df = d3.time.format('%b %d');
        var pf = d3.formatPrefix(d);

        // format as date or not, of course user can pass in
        // a custom function if desired
        if(args.data[0][0][args.x_accessor] instanceof Date) {
            return args.processed.main_x_time_format(d);
        } if (typeof args.data[0][0][args.x_accessor] === 'number') {
            if (d < 1.0) {
                //don't scale tiny values
                return args.xax_units + d3.round(d, args.decimals);
            } else {
                pf = d3.formatPrefix(d);
                return args.xax_units + pf.scale(d) + pf.symbol;
            }
        } else {
            return d;
        }
    };
}

function mg_add_x_ticks(g, args) {
    var last_i = args.scales.X.ticks(args.xax_count).length - 1;

    if (args.chart_type !== 'bar' && !args.x_extended_ticks && !args.y_extended_ticks) {
        //extend axis line across bottom, rather than from domain's min..max
        g.append('line')
            .attr('x1',
                (args.concise === false || args.xax_count === 0)
                    ? args.left + args.buffer
                    : (args.scales.X(args.scales.X.ticks(args.xax_count)[0])).toFixed(2)
            )
            .attr('x2',
                (args.concise === false || args.xax_count === 0)
                    ? args.width - args.right - args.buffer
                    : (args.scales.X(args.scales.X.ticks(args.xax_count)[last_i])).toFixed(2)
            )
            .attr('y1', args.height - args.bottom)
            .attr('y2', args.height - args.bottom);
    }

    g.selectAll('.mg-xax-ticks')
        .data(args.scales.X.ticks(args.xax_count)).enter()
            .append('line')
                .attr('x1', function(d) { return args.scales.X(d).toFixed(2); })
                .attr('x2', function(d) { return args.scales.X(d).toFixed(2); })
                .attr('y1', args.height - args.bottom)
                .attr('y2', function() {
                    return (args.x_extended_ticks)
                        ? args.top
                        : args.height - args.bottom + args.xax_tick_length;
                })
                .attr('class', function() {
                    if (args.x_extended_ticks) {
                        return 'mg-extended-x-ticks';
                    }
                });
}

function mg_add_x_tick_labels(g, args) {
    g.selectAll('.mg-xax-labels')
        .data(args.scales.X.ticks(args.xax_count)).enter()
            .append('text')
                .attr('x', function(d) { return args.scales.X(d).toFixed(2); })
                .attr('y', (args.height - args.bottom + args.xax_tick_length * 7 / 3).toFixed(2))
                .attr('dy', '.50em')
                .attr('text-anchor', 'middle')
                .text(function(d) {
                    return args.xax_units + args.xax_format(d);
                });

    if (args.time_series && (args.show_years || args.show_secondary_x_label)) {
        var secondary_marks,
            secondary_function, yformat;

        var time_frame = args.processed.x_time_frame;

        switch(time_frame) {
            case 'seconds':
                secondary_function = d3.time.days;
                yformat = d3.time.format('%I %p');
                break;
            case 'less-than-a-day':
                secondary_function = d3.time.days;
                yformat = d3.time.format('%b %d');
                break;
            case 'four-days':
                secondary_function = d3.time.days;
                yformat = d3.time.format('%b %d');
                break;
            default:
                secondary_function = d3.time.years;
                yformat = d3.time.format('%Y');
        }

        var years = secondary_function(args.processed.min_x, args.processed.max_x);

        if (years.length === 0) {
            var first_tick = args.scales.X.ticks(args.xax_count)[0];
            years = [first_tick];
        }

        //append year marker to x-axis group
        g = g.append('g')
            .classed('mg-year-marker', true)
            .classed('mg-year-marker-small', args.use_small_class);

        if (time_frame === 'default') {
            g.selectAll('.mg-year-marker')
                .data(years).enter()
                    .append('line')
                        .attr('x1', function(d) { return args.scales.X(d).toFixed(2); })
                        .attr('x2', function(d) { return args.scales.X(d).toFixed(2); })
                        .attr('y1', args.top)
                        .attr('y2', args.height - args.bottom);
        }

        g.selectAll('.mg-year-marker')
            .data(years).enter()
                .append('text')
                    .attr('x', function(d) { return args.scales.X(d).toFixed(2); })
                    .attr('y', (args.height - args.bottom + args.xax_tick_length * 7 / 1.3).toFixed(2))
                    .attr('dy', args.use_small_class ? -3 : 0)//(args.y_extended_ticks) ? 0 : 0 )
                    .attr('text-anchor', 'middle')
                    .text(function(d) {
                        return yformat(d);
                    });
    }
}

function mg_find_min_max_x(args) {
    var last_i,
        extent_x = [],
        min_x,
        max_x,
        all_data = [].concat.apply([], args.data),
        mapDtoX = function(d) { return d[args.x_accessor]; };

    // clear the cached xax_format in case we need to recalculate
    if(args.xax_format === null) {
        delete args.xax_format;
    }

    if (args.chart_type === 'line' || args.chart_type === 'point' || args.chart_type === 'histogram') {
        extent_x = d3.extent(all_data, mapDtoX);
        min_x = extent_x[0];
        max_x = extent_x[1];

    } else if (args.chart_type === 'bar') {
        min_x = 0;
        max_x = d3.max(all_data, function(d) {
            var trio = [
                d[args.x_accessor],
                (d[args.baseline_accessor]) ? d[args.baseline_accessor] : 0,
                (d[args.predictor_accessor]) ? d[args.predictor_accessor] : 0
            ];
            return Math.max.apply(null, trio);
        });
    }
    //if data set is of length 1, expand the range so that we can build the x-axis
    //of course, a line chart doesn't make sense in this case, so the preferred
    //method would be to check for said object's length and, if appropriate,
    //change the chart type to 'point'
    if (min_x === max_x) {
        if (min_x instanceof Date) {
            var yesterday = MG.clone(min_x).setDate(min_x.getDate() - 1);
            var tomorrow = MG.clone(min_x).setDate(min_x.getDate() + 1);

            min_x = yesterday;
            max_x = tomorrow;
        } else if (typeof min_x === 'number') {
            min_x = min_x - 1;
            max_x = max_x + 1;
        } else if (typeof min_x === 'string') {
            min_x = Number(min_x) - 1;
            max_x = Number(max_x) + 1;
        }

        //force xax_count to be 2
        args.xax_count = 2;
    }

    min_x = args.min_x ? args.min_x : min_x;
    max_x = args.max_x ? args.max_x : max_x;
    args.x_axis_negative = false;

    args.processed.min_x = min_x;
    args.processed.max_x = max_x;

    mg_select_xax_format(args);

    if (!args.time_series) {
        if (args.processed.min_x < 0) {
            args.processed.min_x = args.processed.min_x  - (args.processed.max_x * (args.inflator - 1));
            args.x_axis_negative = true;
        }
    }

    if (args.chart_type === 'bar') {
        args.additional_buffer = args.buffer * 5;
    } else {
        args.additional_buffer = 0;
    }
}

function mg_select_xax_format(args) {
    if (!args.xax_format && args.chart_type === 'line') args.xax_format       = mg_default_xax_format(args);
    if (!args.xax_format && args.chart_type === 'point') args.xax_format      = mg_default_xax_format(args);
    if (!args.xax_format && args.chart_type === 'histogram') args.xax_format  = mg_default_xax_format(args);
    if (!args.xax_format && args.chart_type === 'bar') args.xax_format        = mg_default_bar_xax_format(args);
}
