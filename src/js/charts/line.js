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
    }

    this.mainPlot = function() {
        var svg = d3.select($(args.target).find('svg').get(0));
        var g;
        var data_median = 0;

        //main area
        var area = d3.svg.area()
            .x(args.scalefns.xf)
            .y0(args.scales.Y.range()[0])
            .y1(args.scalefns.yf)
            .interpolate(args.interpolate);

        //confidence band
        var confidence_area;

        //if it already exists, remove it
        var $existing_band = $(args.target).find('svg path.mg-confidence-band').first();
        if($existing_band.length > 0) {
            $existing_band.remove();
        }

        if(args.show_confidence_band) {
            var confidence_area = d3.svg.area()
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

        for(var i=args.data.length-1; i>=0; i--) {
            this_data = args.data[i];

            //override increment if we have a custom increment series
            var line_id = i+1;
            if(args.custom_line_color_map.length > 0) {
                line_id = args.custom_line_color_map[i];
            }

            //add confidence band
            if(args.show_confidence_band) {
                svg.append('path')
                    .attr('class', 'mg-confidence-band')
                    .attr('d', confidence_area(args.data[i]));
            }

            //add the area
            var $area = $(args.target).find('svg path.mg-area' + (line_id) + '-color');
            if(args.area && !args.use_data_y_min && !args.y_axis_negative && args.data.length <= 1) {
                //if area already exists, transition it
                if($area.length > 0) {
                    $(svg.node()).find('.mg-y-axis').after($area.detach());
                    d3.select($area.get(0))
                        .transition()
                            .duration(function() {
                                return (args.transition_on_update) ? 1000 : 0;
                            })
                            .attr('d', area(args.data[i]));
                }
                else { //otherwise, add the area
                    svg.append('path')
                        .attr('class', 'mg-main-area ' + 'mg-area' + (line_id) + '-color')
                        .attr('d', area(args.data[i]));
                }
            } else if ($area.length > 0) {
              $area.remove();
            }

            //add the line, if it already exists, transition the fine gentleman
            var $existing_line = $(args.target).find('svg path.mg-main-line.mg-line' + (line_id) + '-color').first();
            if($existing_line.length > 0) {
                $(svg.node()).find('.mg-y-axis').after($existing_line.detach());
                d3.select($existing_line.get(0))
                    .transition()
                        .duration(function() {
                            return (args.transition_on_update) ? 1000 : 0;
                        })
                        .attr('d', line(args.data[i]));
            }
            else { //otherwise...
                //if we're animating on load, animate the line from its median value
                if(args.animate_on_load) {
                    data_median = d3.median(args.data[i], function(d) {
                        return d[args.y_accessor];
                    })

                    svg.append('path')
                        .attr('class', 'mg-main-line ' + 'mg-line' + (line_id) + '-color')
                        .attr('d', flat_line(args.data[i]))
                        .transition()
                            .duration(1000)
                            .attr('d', line(args.data[i]));
                }
                else { //or just add the line
                    svg.append('path')
                        .attr('class', 'mg-main-line ' + 'mg-line' + (line_id) + '-color')
                        .attr('d', line(args.data[i]));
                }
            }

            //build legend
            if(args.legend) {
                legend = "<span class='mg-line" + line_id  + "-legend-color'>&mdash; "
                        + args.legend[i] + "&nbsp; </span>" + legend;
            }
        }

        if(args.legend) {
            $(args.legend_target).html(legend);
        }

        return this;
    }

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
        svg.append('text')
            .attr('class', 'mg-active-datapoint')
            .classed('mg-active-datapoint-small', args.use_small_class)
            .attr('xml:space', 'preserve')
            .attr('x', args.width - args.right)
            .attr('y', args.top / 2)
            .attr('text-anchor', 'end');

        //append circle
        svg.append('circle')
            .classed('mg-line-rollover-circle', true)
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', 0);

        //update our data by setting a unique line id for each series
        //increment from 1... unless we have a custom increment series
        var line_id = 1;

        for(var i=0;i<args.data.length;i++) {
            for(var j=0;j<args.data[i].length;j++) {
                //if custom line-color map is set, use that instead of line_id
                if(args.custom_line_color_map.length > 0) {
                    args.data[i][j]['line_id'] = args.custom_line_color_map[i];
                }
                else {
                    args.data[i][j]['line_id'] = line_id;
                }
            }
            line_id++;
        }

        //for multi-line, use voronoi
        if(args.data.length > 1) {
            //main rollover
            var voronoi = d3.geom.voronoi()
                .x(function(d) { return args.scales.X(d[args.x_accessor]).toFixed(2); })
                .y(function(d) { return args.scales.Y(d[args.y_accessor]).toFixed(2); })
                .clipExtent([[args.buffer, args.buffer], [args.width - args.buffer, args.height - args.buffer]]);

            var g = svg.append('g')
                .attr('class', 'mg-voronoi')

            //we'll be using these when constructing the voronoi rollovers
            var data_nested = d3.nest()
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
                            if(args.linked) {
                                var v = d[args.x_accessor];
                                var formatter = d3.time.format('%Y-%m-%d');

                                //only format when x-axis is date
                                var id = (typeof v === 'number')
                                        ? i
                                        : formatter(v);

                                return 'mg-line' + d['line_id'] + '-color ' + 'roll_' + id;
                            }
                            else {
                                return 'mg-line' + d['line_id'] + '-color';
                            }
                        })
                        .on('mouseover', this.rolloverOn(args))
                        .on('mouseout', this.rolloverOff(args));
        }
        //for single line, use rects
        else {
            //set to 1 unless we have a custom increment series
            var line_id = 1;
            if(args.custom_line_color_map.length > 0) {
                line_id = args.custom_line_color_map[0];
            }

            var g = svg.append('g')
                .attr('class', 'mg-rollover-rect')

            var xf = args.data[0].map(args.scalefns.xf);

            g.selectAll('.mg-rollover-rects')
                .data(args.data[0]).enter()
                    .append('rect')
                        .attr('class', function(d, i) {
                            if(args.linked) {
                                var v = d[args.x_accessor];
                                var formatter = d3.time.format('%Y-%m-%d');

                                //only format when x-axis is date
                                var id = (typeof v === 'number')
                                        ? i
                                        : formatter(v);

                                return 'mg-line' + line_id + '-color ' + 'roll_' + id;
                            }
                            else {
                                return 'mg-line' + line_id + '-color';
                            }
                        })
                        .attr('x', function(d, i) {
                            if (i == 0) {
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
                            if (i == 0) {
                                return ((xf[i+1] - xf[i]) / 2).toFixed(2);
                            }
                            else if (i == xf.length - 1) {
                                return ((xf[i] - xf[i-1]) / 2).toFixed(2);
                            }
                            else {
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

        return this;
    }

    this.rolloverOn = function(args) {
        var svg = d3.select($(args.target).find('svg').get(0));
        var x_formatter = d3.time.format('%Y-%m-%d');

        return function(d, i) {
            //show circle on mouse-overed rect
            svg.selectAll('circle.mg-line-rollover-circle')
                .attr('class', "")
                .attr('class', 'mg-area' + d['line_id'] + '-color')
                .classed('mg-line-rollover-circle', true)
                .attr('cx', function() {
                    return args.scales.X(d[args.x_accessor]).toFixed(2);
                })
                .attr('cy', function() {
                    return args.scales.Y(d[args.y_accessor]).toFixed(2);
                })
                .attr('r', args.point_size)
                .style('opacity', 1);

            //trigger mouseover on all rects for this date in .linked charts
            if(args.linked && !MG.globals.link) {
                MG.globals.link = true;

                var v = d[args.x_accessor];
                var formatter = d3.time.format('%Y-%m-%d');

                //only format when y-axis is date
                var id = (typeof v === 'number')
                        ? i
                        : formatter(v);

                //trigger mouseover on matching line in .linked charts
                d3.selectAll('.mg-line' + d['line_id'] + '-color.roll_' + id)
                    .each(function(d, i) {
                        d3.select(this).on('mouseover')(d,i);
                })
            }

            svg.selectAll('text')
                .filter(function(g, j) {
                    return d == g;
                })
                .attr('opacity', 0.3);

            var fmt = d3.time.format('%b %e, %Y');

            if (args.format == 'count') {
                var num = function(d_) {
                    var is_float = d_ % 1 != 0;
                    var n = d3.format("0,000");
                    d_ = is_float ? d3.round(d_, args.decimals) : d_;
                    return n(d_);
                }
            }
            else {
                var num = function(d_) {
                    var fmt_string = (args.decimals ? '.' + args.decimals : '' ) + '%';
                    var n = d3.format(fmt_string);
                    return n(d_);
                }
            }

            //update rollover text
            if (args.show_rollover_text) {
                svg.select('.mg-active-datapoint')
                    .text(function() {
                        if(args.time_series) {
                            var dd = new Date(+d[args.x_accessor]);
                            dd.setDate(dd.getDate());

                            return fmt(dd) + '  ' + args.yax_units
                                + num(d[args.y_accessor]);
                        }
                        else {
                            return args.x_accessor + ': ' + d[args.x_accessor]
                                + ', ' + args.y_accessor + ': ' + args.yax_units
                                + num(d[args.y_accessor]);
                        }
                    });
            }

            if(args.mouseover) {
                args.mouseover(d, i);
            }
        }
    }

    this.rolloverOff = function(args) {
        var svg = d3.select($(args.target).find('svg').get(0));

        return function(d, i) {
            if(args.linked && MG.globals.link) {
                MG.globals.link = false;

                var v = d[args.x_accessor];
                var formatter = d3.time.format('%Y-%m-%d');

                //only format when y-axis is date
                var id = (typeof v === 'number')
                        ? i
                        : formatter(v);

                d3.selectAll('.roll_' + id)
                    .each(function(d, i) {
                        d3.select(this).on('mouseout')(d);
                });
            }

            //remove active datapoint text on mouse out
            svg.selectAll('circle.mg-line-rollover-circle')
                .style('opacity', 0);

            svg.select('.mg-active-datapoint')
                .text('');

            if(args.mouseout) {
                args.mouseout(d, i);
            }
        }
    }

    this.rolloverMove = function(args) {
        return function(d, i) {
            if(args.mousemove) {
                args.mousemove(d, i);
            }
        }
    }

    this.init(args);
    return this;
}
