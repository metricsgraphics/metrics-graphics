(function() {
    'use strict';

    function lineChart(args) {

        this.init = function(args) {
            this.args = args;

            if (!args.data || args.data.length === 0) {
                args.error = 'No data was supplied';
                error(args);
                return this;
            }

            raw_data_transformation(args);
            process_line(args);
            init(args);
            x_axis(args);
            y_axis(args);

            this.markers();
            this.mainPlot();
            this.rollover();
            this.windowListeners();

            MG.call_hook('line.after_init', this);

            return this;
        };

        this.mainPlot = function() {
            var svg = mg_get_svg_child_of(args.target);

            //remove any old legends if they exist
            svg.selectAll('.mg-line-legend').remove();

            var legend_group;
            var this_legend;
            if (args.legend) {
                legend_group = svg.append('g')
                    .attr('class', 'mg-line-legend');
            }
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
                .interpolate(args.interpolate)
                .tension(args.interpolate_tension);

            //confidence band
            var confidence_area;
            var existing_band = svg.selectAll('.mg-confidence-band');

            if (args.show_confidence_band) {
                confidence_area = d3.svg.area()
                    .defined(function(d) { if (args.missing_is_value){return d.value != args.missing_value; }else{return d.value}})
                    .x(args.scalefns.xf)
                    .y0(function(d) {
                        var l = args.show_confidence_band[0];
                        return args.scales.Y(d[l]);
                    })
                    .y1(function(d) {
                        var u = args.show_confidence_band[1];
                        return args.scales.Y(d[u]);
                    })
                    .interpolate(args.interpolate)
                    .tension(args.interpolate_tension);
            }

            //main line
            var line = d3.svg.line()
                .defined(function(d) { if (args.missing_is_value){return d.value != args.missing_value; }else{return d.value}})
                .x(args.scalefns.xf)
                .y(args.scalefns.yf)
                .interpolate(args.interpolate)
                .tension(args.interpolate_tension);

            //for animating line on first load
            var flat_line = d3.svg.line()
                .defined(function(d) { if (args.missing_is_value){return d.value != args.missing_value; }else{return d.value}})
                .x(args.scalefns.xf)
                .y(function() { return args.scales.Y(data_median); })
                .interpolate(args.interpolate)
                .tension(args.interpolate_tension);

            //for building the optional legend
            var legend = '';
            var this_data;
            var confidenceBand;

            // should we continue with the default line render? A `line.all_series` hook should return false to prevent the default.
            var continueWithDefault = MG.call_hook('line.before_all_series', [args]);
            if (continueWithDefault !== false) {
                for (var i = args.data.length - 1; i >= 0; i--) {
                    this_data = args.data[i];

                    // passing the data for the current line
                    MG.call_hook('line.before_each_series', [this_data, args]);

                    //override increment if we have a custom increment series
                    var line_id = i + 1;
                    if (args.custom_line_color_map.length > 0) {
                        line_id = args.custom_line_color_map[i];
                    }

                    args.data[i].line_id = line_id;

                    if (this_data.length === 0) {
                        continue;
                    }

                    //add confidence band
                    if (args.show_confidence_band) {
                        if (!existing_band.empty()) {
                            confidenceBand = existing_band
                                .transition()
                                .duration(function() {
                                    return (args.transition_on_update) ? 1000 : 0;
                                });
                        } else {
                            confidenceBand = svg.append('path')
                                .attr('class', 'mg-confidence-band');
                        }

                        confidenceBand
                            .attr('d', confidence_area(args.data[i]))
                            .attr('clip-path', 'url(#mg-plot-window-'+ mg_target_ref(args.target)+')');
                    }

                    //add the area
                    var areas = svg.selectAll('.mg-main-area.mg-area' + (line_id) + '-color');
                    var displayArea = args.area && !args.use_data_y_min && !args.y_axis_negative && args.data.length <= 1;
                    if (displayArea) {
                        //if area already exists, transition it
                        if (!areas.empty()) {
                            svg.select('.mg-y-axis').node().parentNode.appendChild(areas.node());

                            areas
                                .transition()
                                    .duration(updateTransitionDuration)
                                    .attr('d', area(args.data[i]))
                                    .attr('clip-path', 'url(#mg-plot-window-'+ mg_target_ref(args.target)+')');
                        } else { //otherwise, add the area
                            svg.append('path')
                                .attr('class', 'mg-main-area ' + 'mg-area' + (line_id) + '-color')
                                .attr('d', area(args.data[i]))
                                .attr('clip-path', 'url(#mg-plot-window-' + mg_target_ref(args.target) + ')');
                        }
                    } else if (!areas.empty()) {
                        areas.remove();
                    }

                    //add the line, if it already exists, transition the fine gentleman
                    var existing_line = svg.select('path.mg-main-line.mg-line' + (line_id) + '-color');
                    if (!existing_line.empty()) {
                        //$(svg.node()).find('.mg-y-axis').after($(existing_line.node()).detach());
                        svg.select('.mg-y-axis').node().parentNode.appendChild(existing_line.node());

                        var lineTransition = existing_line
                            .transition()
                            .duration(updateTransitionDuration);

                        if (!displayArea) {
                            lineTransition.attrTween('d', path_tween(line(args.data[i]), 4));
                        } else {
                            lineTransition.attr('d', line(args.data[i]));
                        }
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
                                    .attr('clip-path', 'url(#mg-plot-window-' + mg_target_ref(args.target) + ')');
                        } else { //or just add the line
                            svg.append('path')
                                .attr('class', 'mg-main-line ' + 'mg-line' + (line_id) + '-color')
                                .attr('d', line(args.data[i]))
                                .attr('clip-path', 'url(#mg-plot-window-' + mg_target_ref(args.target) + ')');
                        }
                    }

                    var the_line = svg.select('.mg-line' + (line_id) + '-color');
                    if (args.missing_is_hidden && the_line.attr('d') !== null) {
                        var bits = the_line.attr('d').split('L');
                        var zero = args.scales.Y(0) + 42.1234;
                        var dasharray = [];
                        var singleton_point_length = 2;

                        var x_y,
                            x_y_plus_1,
                            x,
                            y,
                            x_plus_1,
                            y_plus_1,
                            segment_length,
                            cumulative_segment_length = 0;

                        bits[0] = bits[0].replace('M', '');
                        bits[bits.length - 1] = bits[bits.length - 1].replace('Z', '');

                        //if we have a min_x, turn the line off first
                        if (args.min_x) {
                            dasharray.push(0);
                        }

                        //build the stroke-dasharray pattern
                        for (var j = 0; j < bits.length - 1; j++) {
                            x_y = bits[j].split(',');
                            x_y_plus_1 = bits[j + 1].split(',');
                            x = Number(x_y[0]);
                            y = Number(x_y[1]);
                            x_plus_1 = Number(x_y_plus_1[0]);
                            y_plus_1 = Number(x_y_plus_1[1]);

                            segment_length = Math.sqrt(Math.pow(x - x_plus_1, 2) + Math.pow(y - y_plus_1, 2));

                            //do we need to either cover or clear the current stroke
                            if (y_plus_1 == zero && y != zero) {
                                dasharray.push(cumulative_segment_length || singleton_point_length);
                                cumulative_segment_length = (cumulative_segment_length)
                                    ? segment_length
                                    : segment_length - singleton_point_length;
                            } else if (y_plus_1 != zero && y == zero) { //switching on line
                                dasharray.push(cumulative_segment_length += segment_length);
                                cumulative_segment_length = 0;
                            } else {
                                cumulative_segment_length += segment_length;
                            }
                        }

                        //fear not, end bit of line, ye too shall be covered
                        if (dasharray.length > 0) {
                            dasharray.push(the_line.node().getTotalLength() - dasharray[dasharray.length - 1]);

                            svg.select('.mg-line' + (line_id) + '-color')
                                .attr('stroke-dasharray', dasharray.join());
                        }
                    }

                    //build legend
                    if (args.legend) {
                        if (is_array(args.legend)) {
                            this_legend = args.legend[i];
                        } else if (is_function(args.legend)) {
                            this_legend = args.legend(this_data);
                        }

                        if (args.legend_target) {
                            legend = "<span class='mg-line" + line_id  + "-legend-color'>&mdash; "
                                + this_legend + "&nbsp; </span>" + legend;
                        } else {

                            var last_point = this_data[this_data.length-1];
                            legend_group.append('svg:text')
                                .classed('mg-line' + (line_id) + '-legend-color', true)
                                .attr('x', args.scalefns.xf(last_point))
                                .attr('dx', args.buffer)
                                .attr('y', args.scalefns.yf(last_point))
                                .attr('dy', '.35em')
                                .attr('font-size', 10)
                                .attr('font-weight', '300')
                                .text(this_legend);

                            preventVerticalOverlap(legend_group.selectAll('.mg-line-legend-text')[0], args);
                        }
                    }

                    // passing the data for the current line
                    MG.call_hook('line.after_each_series', [this_data, existing_line, args]);
                }
            }

            if (args.legend_target) {
                d3.select(args.legend_target).html(legend);
            }

            return this;
        };

        this.markers = function() {
            markers(args);
            return this;
        };

        this.rollover = function() {
            var svg = mg_get_svg_child_of(args.target);
            var g;
            var i;

            //remove the old rollovers if they already exist
            svg.selectAll('.mg-rollover-rect').remove();
            svg.selectAll('.mg-voronoi').remove();

            //remove the old rollover text and circle if they already exist
            svg.selectAll('.mg-active-datapoint').remove();
            svg.selectAll('.mg-line-rollover-circle').remove();
            svg.selectAll('.mg-active-datapoint-container').remove();

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

            for (i = 0; i < args.data.length; i++) {
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
                            .filter(function(d) { return d !== undefined; })
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
                svg.select('.mg-rollover-rect rect')
                    .on('mouseover')(args.data[0][0], 0);
            } else if (args.data.length > 1) {
                //otherwise, trigger it for an appropriate line in a multi-line chart
                for (var i = 0; i < args.data.length; i++) {
                    var j = i + 1;

                    if (args.custom_line_color_map.length > 0
                        && args.custom_line_color_map[i] !== undefined) {
                        j = args.custom_line_color_map[i];
                    }

                    if (args.data[i].length == 1) {
                        svg.selectAll('.mg-voronoi .mg-line' + j + '-color')
                            .on('mouseover')(args.data[i][0], 0);

                        svg.selectAll('.mg-voronoi .mg-line' + j + '-color')
                            .on('mouseout')(args.data[i][0], 0);
                    }
                }
            }

            MG.call_hook('line.after_rollover', args);

            return this;
        };

        this.rolloverOn = function(args) {
            var svg = mg_get_svg_child_of(args.target);
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
                        var circle = svg.select('circle.mg-line-rollover-circle.mg-line' + datum.line_id + '-color')
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
                } else if (args.missing_is_hidden
                            && d[args.y_accessor] == 0
                            && d['missing']) {
                    //disable rollovers for hidden parts of the line
                    return;
                } else {

                    //show circle on mouse-overed rect
                    if (d[args.x_accessor] >= args.processed.min_x &&
                        d[args.x_accessor] <= args.processed.max_x &&
                        d[args.y_accessor] >= args.processed.min_y &&
                        d[args.y_accessor] <= args.processed.max_y
                    ){
                        svg.selectAll('circle.mg-line-rollover-circle.mg-area' + d.line_id + '-color')
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

                var num = format_rollover_number(args);

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

                // MG.call_hook()
            };
        };

        this.rolloverOff = function(args) {
            var svg = mg_get_svg_child_of(args.target);

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

                //remove all active data points when aggregate_rollover is enabled
                if (args.aggregate_rollover) {
                    svg.selectAll('circle.mg-line-rollover-circle')
                        .style('opacity', function() {
                            return 0;
                        });
                //remove active data point text on mouse out, except if we have a single point
                } else {
                    svg.selectAll('circle.mg-line-rollover-circle.mg-area' + (d.line_id) + '-color')
                        .style('opacity', function() {
                            var id = d.line_id - 1;

                            if (args.custom_line_color_map.length > 0
                                    && args.custom_line_color_map.indexOf(d.line_id) !== undefined
                                ) {
                                id = args.custom_line_color_map.indexOf(d.line_id);
                            }

                            if (args.data[id].length == 1) {
                            //if (args.data.length === 1 && args.data[0].length === 1) {
                                return 1;
                            }
                            else {
                                return 0;
                            }
                        });
                }

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
    }

    MG.register('line', lineChart);
}).call(this);
