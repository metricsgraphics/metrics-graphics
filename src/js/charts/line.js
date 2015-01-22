charts.line = function(args) {
    'use strict';
    this.args = args;

    this.init = function(args) {
        raw_data_transformation(args);
        process_line(args);
        init(args);
        x_axis(args);
        y_axis(args);
        return this;
    };

    this.mainPlot = function() {
        var svg = d3.select($(args.target).find('svg').get(0));
        var g;
        var data_median = 0;
        var updateTransitionDuration = (args.transition_on_update) ? 1000 : 0;
        var mapToY = function(d) {
            return d[args.y_accessor];
        };

        //main area
        var area = d3.svg.area()
            .x(args.scalefns.xf)
            .y0(args.scales.Y.range()[0])
            .y1(args.scalefns.yf)
            .interpolate(args.interpolate);

        //confidence band
        var confidence_area;

        //if it already exists, remove it
        var $existing_band = $(args.target).find('.mg-confidence-band');
        if ($existing_band.length > 0) {
            $existing_band.remove();
        }

        if (args.show_confidence_band) {
            confidence_area = d3.svg.area()
                .x(args.scalefns.xf)
                .y0(function(d) {
                    var l = args.show_confidence_band[0];
                    return args.scales.Y(d[l]);
                })
                .y1(function(d) {
                    var u = args.show_confidence_band[1];
                    return args.scales.Y(d[u]);
                })
                .interpolate(args.interpolate);
        }

        //main line
        var line = d3.svg.line()
            .x(args.scalefns.xf)
            .y(args.scalefns.yf)
            .interpolate(args.interpolate);

        //for animating line on first load
        var flat_line = d3.svg.line()
            .x(args.scalefns.xf)
            .y(function() { return args.scales.Y(data_median); })
            .interpolate(args.interpolate);


        //for building the optional legend
        var legend = '';
        var this_data;

        for (var i = args.data.length - 1; i >= 0; i--) {
            this_data = args.data[i];

            //override increment if we have a custom increment series
            var line_id = i + 1;
            if (args.custom_line_color_map.length > 0) {
                line_id = args.custom_line_color_map[i];
            }

            args.data[i].line_id = line_id;

            //add confidence band
            if (args.show_confidence_band) {
                svg.append('path')
                    .attr('class', 'mg-confidence-band')
                    .attr('d', confidence_area(args.data[i]))
                    .attr('clip-path', 'url(#mg-plot-window-' + mg_strip_punctuation(args.target) + ')');
            }

            //add the area
            var $area = $(args.target).find('svg path.mg-area' + (line_id) + '-color');
            if (args.area && !args.use_data_y_min && !args.y_axis_negative && args.data.length <= 1) {
                //if area already exists, transition it
                if ($area.length > 0) {
                    $(svg.node()).find('.mg-y-axis').after($area.detach());
                    d3.select($area.get(0))
                        .transition()
                            .duration(updateTransitionDuration)
                            .attr('d', area(args.data[i]))
                            .attr('clip-path', 'url(#mg-plot-window)');
                } else { //otherwise, add the area
                    svg.append('path')
                        .attr('class', 'mg-main-area ' + 'mg-area' + (line_id) + '-color')
                        .attr('d', area(args.data[i]))
                        .attr('clip-path', 'url(#mg-plot-window-' + mg_strip_punctuation(args.target) + ')');
                }
            } else if ($area.length > 0) {
                $area.remove();
            }

            //add the line, if it already exists, transition the fine gentleman
            var $existing_line = $(args.target).find('svg path.mg-main-line.mg-line' + (line_id) + '-color').first();
            if ($existing_line.length > 0) {
                $(svg.node()).find('.mg-y-axis').after($existing_line.detach());
                d3.select($existing_line.get(0))
                    .transition()
                        .duration(updateTransitionDuration)
                        .attr('d', line(args.data[i]));
            }
            else { //otherwise...
                //if we're animating on load, animate the line from its median value
                if (args.animate_on_load) {
                    data_median = d3.median(args.data[i], mapToY);

                    svg.append('path')
                        .attr('class', 'mg-main-line ' + 'mg-line' + (line_id) + '-color')
                        .attr('d', flat_line(args.data[i]))
                        .transition()
                            .duration(1000)
                            .attr('d', line(args.data[i]))
                            .attr('clip-path', 'url(#mg-plot-window-' + mg_strip_punctuation(args.target) + ')');
                } else { //or just add the line
                    svg.append('path')
                        .attr('class', 'mg-main-line ' + 'mg-line' + (line_id) + '-color')
                        .attr('d', line(args.data[i]))
                        .attr('clip-path', 'url(#mg-plot-window-' + mg_strip_punctuation(args.target) + ')');
                }
            }

            //build legend
            if (args.legend) {
                legend = "<span class='mg-line" + line_id  + "-legend-color'>&mdash; "
                        + args.legend[i] + "&nbsp; </span>" + legend;
            }
        }

        if (args.legend) {
            $(args.legend_target).html(legend);
        }

        return this;
    };

    this.markers = function() {
        markers(args);
        return this;
    };

    this.rollover = function() {
        var svg = d3.select($(args.target).find('svg').get(0));
        var $svg = $($(args.target).find('svg').get(0));
        var g;

        //remove the old rollovers if they already exist
        $svg.find('.mg-rollover-rect').remove();
        $svg.find('.mg-voronoi').remove();

        //remove the old rollover text and circle if they already exist
        $svg.find('.mg-active-datapoint').remove();
        $svg.find('.mg-line-rollover-circle').remove();

        //rollover text
        svg.append('g')
            .attr('class', 'mg-active-datapoint-container')
            .attr('transform', 'translate(' + (args.width - args.right) + ',' + (args.top / 2) + ')')
            .append('text')
                .attr('class', 'mg-active-datapoint')
                .classed('mg-active-datapoint-small', args.use_small_class)
                .attr('xml:space', 'preserve')
                .attr('text-anchor', 'end');

        //append circle
        svg.selectAll('.mg-line-rollover-circle')
            .data(args.data).enter()
                .append('circle')
                .attr({
                  'class': function(d, i) {
                      return [
                          'mg-line-rollover-circle',
                          'mg-line' + d.line_id + '-color',
                          'mg-area' + d.line_id + '-color'
                      ].join(' ');
                  },
                  'cx': 0,
                  'cy': 0,
                  'r': 0
                });

        //update our data by setting a unique line id for each series
        //increment from 1... unless we have a custom increment series
        var line_id = 1;

        for (var i = 0; i < args.data.length; i++) {
            for (var j = 0; j < args.data[i].length; j++) {
                //if custom line-color map is set, use that instead of line_id
                if (args.custom_line_color_map.length > 0) {
                    args.data[i][j].line_id = args.custom_line_color_map[i];
                } else {
                    args.data[i][j].line_id = line_id;
                }
            }
            line_id++;
        }

        var data_nested;
        var xf;

        //for multi-line, use voronoi
        if (args.data.length > 1 && !args.aggregate_rollover) {
            //main rollover
            var voronoi = d3.geom.voronoi()
                .x(function(d) { return args.scales.X(d[args.x_accessor]).toFixed(2); })
                .y(function(d) { return args.scales.Y(d[args.y_accessor]).toFixed(2); })
                .clipExtent([[args.buffer, args.buffer], [args.width - args.buffer, args.height - args.buffer]]);

            g = svg.append('g')
                .attr('class', 'mg-voronoi');

            //we'll be using these when constructing the voronoi rollovers
            data_nested = d3.nest()
                .key(function(d) {
                    return args.scales.X(d[args.x_accessor]) + ","
                        + args.scales.Y(d[args.y_accessor]);
                })
                .rollup(function(v) { return v[0]; })
                .entries(d3.merge(args.data.map(function(d) { return d; })))
                .map(function(d) { return d.values; });

            //add the voronoi rollovers
            g.selectAll('path')
                .data(voronoi(data_nested))
                .enter()
                    .append('path')
                        .attr("d", function(d) { return "M" + d.join("L") + "Z"; })
                        .datum(function(d) { return d.point; }) //because of d3.nest, reassign d
                        .attr('class', function(d) {
                            if (args.linked) {
                                var v = d[args.x_accessor];
                                var formatter = d3.time.format(args.linked_format);

                                //only format when x-axis is date
                                var id = (typeof v === 'number')
                                        ? i
                                        : formatter(v);

                                return 'mg-line' + d.line_id + '-color ' + 'roll_' + id;
                            } else {
                                return 'mg-line' + d.line_id + '-color';
                            }
                        })
                        .on('mouseover', this.rolloverOn(args))
                        .on('mouseout', this.rolloverOff(args))
                        .on('mousemove', this.rolloverMove(args));
        }

        // for multi-lines and aggregated rollovers, use rects
        else if (args.data.length > 1 && args.aggregate_rollover) {
            data_nested = d3.nest()
                .key(function(d) { return d[args.x_accessor]; })
                .entries(d3.merge(args.data));

            xf = data_nested.map(function(di) {
                return args.scales.X(new Date(di.key));
            });

            g = svg.append('g')
              .attr('class', 'mg-rollover-rect');

            g.selectAll('.mg-rollover-rects')
                .data(data_nested).enter()
                    .append('rect')
                        .attr('x', function(d, i) {
                            //if data set is of length 1
                            if(xf.length === 1) {
                                return args.left + args.buffer;
                            } else if (i === 0) {
                                return xf[i].toFixed(2);
                            } else {
                                return ((xf[i-1] + xf[i])/2).toFixed(2);
                            }
                        })
                        .attr('y', args.top)
                        .attr('width', function(d, i) {
                            //if data set is of length 1
                            if(xf.length === 1) {
                                return args.width - args.right - args.buffer;
                            } else if (i === 0) {
                                return ((xf[i+1] - xf[i]) / 2).toFixed(2);
                            } else if (i == xf.length - 1) {
                                return ((xf[i] - xf[i-1]) / 2).toFixed(2);
                            } else {
                                return ((xf[i+1] - xf[i-1]) / 2).toFixed(2);
                            }
                        })
                        .attr('height', args.height - args.bottom - args.top - args.buffer)
                        .attr('opacity', 0)
                        .on('mouseover', this.rolloverOn(args))
                        .on('mouseout', this.rolloverOff(args))
                        .on('mousemove', this.rolloverMove(args));
        }

        //for single line, use rects
        else {
            //set to 1 unless we have a custom increment series
            line_id = 1;
            if (args.custom_line_color_map.length > 0) {
                line_id = args.custom_line_color_map[0];
            }

            g = svg.append('g')
                .attr('class', 'mg-rollover-rect');

            xf = args.data[0].map(args.scalefns.xf);

            g.selectAll('.mg-rollover-rects')
                .data(args.data[0]).enter()
                    .append('rect')
                        .attr('class', function(d, i) {
                            if (args.linked) {
                                var v = d[args.x_accessor];
                                var formatter = d3.time.format(args.linked_format);

                                //only format when x-axis is date
                                var id = (typeof v === 'number')
                                        ? i
                                        : formatter(v);

                                return 'mg-line' + line_id + '-color ' + 'roll_' + id;
                            } else {
                                return 'mg-line' + line_id + '-color';
                            }
                        })
                        .attr('x', function(d, i) {
                            //if data set is of length 1
                            if (xf.length === 1) {
                                return args.left + args.buffer;
                            } else if (i === 0) {
                                return xf[i].toFixed(2);
                            } else {
                                return ((xf[i-1] + xf[i])/2).toFixed(2);
                            }
                        })
                        .attr('y', function(d, i) {
                            return (args.data.length > 1)
                                ? args.scalefns.yf(d) - 6 //multi-line chart sensitivity
                                : args.top;
                        })
                        .attr('width', function(d, i) {
                            //if data set is of length 1
                            if (xf.length === 1) {
                                return args.width - args.right - args.buffer;
                            } else if (i === 0) {
                                return ((xf[i+1] - xf[i]) / 2).toFixed(2);
                            } else if (i === xf.length - 1) {
                                return ((xf[i] - xf[i-1]) / 2).toFixed(2);
                            } else {
                                return ((xf[i+1] - xf[i-1]) / 2).toFixed(2);
                            }
                        })
                        .attr('height', function(d, i) {
                            return (args.data.length > 1)
                                ? 12 //multi-line chart sensitivity
                                : args.height - args.bottom - args.top - args.buffer;
                        })
                        .attr('opacity', 0)
                        .on('mouseover', this.rolloverOn(args))
                        .on('mouseout', this.rolloverOff(args))
                        .on('mousemove', this.rolloverMove(args));
        }

        //if the dataset is of length 1, trigger the rollover for our solitary rollover rect
        if (args.data.length == 1 && args.data[0].length == 1) {
            d3.select('.mg-rollover-rect .mg-line1-color')
                .on('mouseover')(args.data[0][0], 0);
        }

        return this;
    };

    this.rolloverOn = function(args) {
        var svg = d3.select($(args.target).find('svg').get(0));
        var fmt;
        switch(args.processed.x_time_frame) {
            case 'seconds':
                fmt = d3.time.format('%b %e, %Y  %H:%M:%S');
                break;
            case 'less-than-a-day':
                fmt = d3.time.format('%b %e, %Y  %I:%M%p');
                break;
            case 'four-days':
                fmt = d3.time.format('%b %e, %Y  %I:%M%p');
                break;
            default:
                fmt = d3.time.format('%b %e, %Y');
        }

        return function(d, i) {

            if (args.aggregate_rollover && args.data.length > 1) {

                // hide the circles in case a non-contiguous series is present
                svg.selectAll('circle.mg-line-rollover-circle')
                    .style('opacity', 0);

                d.values.forEach(function(datum) {

                  if (datum[args.x_accessor] >= args.processed.min_x &&
                      datum[args.x_accessor] <= args.processed.max_x &&
                      datum[args.y_accessor] >= args.processed.min_y &&
                      datum[args.y_accessor] <= args.processed.max_y
                  ){
                    var circle = svg.select('circle.mg-line' + datum.line_id + '-color')
                        .attr({
                            'cx': function() {
                                return args.scales.X(datum[args.x_accessor]).toFixed(2);
                            },
                            'cy': function() {
                                return args.scales.Y(datum[args.y_accessor]).toFixed(2);
                            },
                            'r': args.point_size
                        })
                        .style('opacity', 1);
                  }
                });
            } else {

                //show circle on mouse-overed rect
                if (d[args.x_accessor] >= args.processed.min_x &&
                    d[args.x_accessor] <= args.processed.max_x &&
                    d[args.y_accessor] >= args.processed.min_y &&
                    d[args.y_accessor] <= args.processed.max_y
                ){
                    svg.selectAll('circle.mg-line-rollover-circle')
                        .attr('class', "")
                        .attr('class', 'mg-area' + d.line_id + '-color')
                        .classed('mg-line-rollover-circle', true)
                        .attr('cx', function() {
                            return args.scales.X(d[args.x_accessor]).toFixed(2);
                        })
                        .attr('cy', function() {
                            return args.scales.Y(d[args.y_accessor]).toFixed(2);
                        })
                        .attr('r', args.point_size)
                        .style('opacity', 1);
                }

                //trigger mouseover on all rects for this date in .linked charts
                if (args.linked && !MG.globals.link) {
                    MG.globals.link = true;

                    var v = d[args.x_accessor];
                    var formatter = d3.time.format(args.linked_format);

                    //only format when y-axis is date
                    var id = (typeof v === 'number')
                            ? i
                            : formatter(v);

                    //trigger mouseover on matching line in .linked charts
                    d3.selectAll('.mg-line' + d.line_id + '-color.roll_' + id)
                        .each(function(d, i) {
                            d3.select(this).on('mouseover')(d,i);
                        });
                }
            }

            svg.selectAll('text')
                .filter(function(g, j) {
                    return d === g;
                })
                .attr('opacity', 0.3);

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

            //update rollover text
            if (args.show_rollover_text) {
                var textContainer = svg.select('.mg-active-datapoint'),
                    lineCount = 0,
                    lineHeight = 1.1;

                textContainer.select('*').remove();

                if (args.aggregate_rollover && args.data.length > 1) {
                    if (args.time_series) {
                        var date = new Date(d.key);

                        textContainer.append('tspan')
                            .text((fmt(date) + '  ' + args.yax_units).trim());

                        lineCount = 1;

                        d.values.forEach(function(datum) {
                            var label = textContainer.append('tspan')
                                .attr({
                                  x: 0,
                                  y: (lineCount * lineHeight) + 'em'
                                })
                                .text(num(datum[args.y_accessor]));

                            textContainer.append('tspan')
                                .attr({
                                  x: -label.node().getComputedTextLength(),
                                  y: (lineCount * lineHeight) + 'em'
                                })
                                .text('\u2014 ') // mdash
                                .classed('mg-hover-line' + datum.line_id + '-color', true)
                                .style('font-weight', 'bold');

                            lineCount++;
                        });

                        textContainer.append('tspan')
                            .attr('x', 0)
                            .attr('y', (lineCount * lineHeight) + 'em')
                            .text('\u00A0');
                    } else {
                        d.values.forEach(function(datum) {
                            var label = textContainer.append('tspan')
                                .attr({
                                  x: 0,
                                  y: (lineCount * lineHeight) + 'em'
                                })
                                .text(args.x_accessor + ': ' + datum[args.x_accessor]
                                    + ', ' + args.y_accessor + ': ' + args.yax_units
                                    + num(datum[args.y_accessor]));

                            textContainer.append('tspan')
                                .attr({
                                  x: -label.node().getComputedTextLength(),
                                  y: (lineCount * lineHeight) + 'em'
                                })
                                .text('\u2014 ') // mdash
                                .classed('mg-hover-line' + datum.line_id + '-color', true)
                                .style('font-weight', 'bold');

                            lineCount++;
                        });
                    }

                    // append an blank (&nbsp;) line to mdash positioning
                    textContainer.append('tspan')
                        .attr('x', 0)
                        .attr('y', (lineCount * lineHeight) + 'em')
                        .text('\u00A0');
                } else {
                    if (args.time_series) {
                        var dd = new Date(+d[args.x_accessor]);
                        dd.setDate(dd.getDate());

                        textContainer.append('tspan')
                            .text(fmt(dd) + '  ' + args.yax_units
                                + num(d[args.y_accessor]));
                    }
                    else {
                        textContainer.append('tspan')
                            .text(args.x_accessor + ': ' + d[args.x_accessor]
                                + ', ' + args.y_accessor + ': ' + args.yax_units
                                + num(d[args.y_accessor]));
                    }
                }
            }

            if (args.mouseover) {
                args.mouseover(d, i);
            }
        };
    };

    this.rolloverOff = function(args) {
        var svg = d3.select($(args.target).find('svg').get(0));

        return function(d, i) {
            if (args.linked && MG.globals.link) {
                MG.globals.link = false;

                var v = d[args.x_accessor];
                var formatter = d3.time.format(args.linked_format);

                //only format when y-axis is date
                var id = (typeof v === 'number')
                        ? i
                        : formatter(v);

                d3.selectAll('.roll_' + id)
                    .each(function(d, i) {
                        d3.select(this).on('mouseout')(d);
                    });
            }

            //remove active datapoint text on mouse out, except if we have a single
            svg.selectAll('circle.mg-line-rollover-circle')
                .style('opacity', function() {
                        if (args.data.length == 1 && args.data[0].length == 1) {
                            return 1;
                        }
                        else {
                            return 0;
                        }
                    });

            svg.select('.mg-active-datapoint')
                .text('');

            if (args.mouseout) {
                args.mouseout(d, i);
            }
        };
    };

    this.rolloverMove = function(args) {
        return function(d, i) {
            if (args.mousemove) {
                args.mousemove(d, i);
            }
        };
    };

    this.windowListeners = function() {
        mg_window_listeners(this.args);
        return this;
    };

    this.init(args);

    return this;
};
