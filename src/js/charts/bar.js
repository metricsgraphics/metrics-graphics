// BARCHART:
// x - function that processes data
//     - pass in a feature name, get a count
//     - have raw feature: value function
// - need a way of changing the y axis and x axis
// - need to sort out rollovers
charts.bar = function(args) {
    'use strict';
    this.args = args;

    this.is_vertical = true;

    this.init = function(args) {
        raw_data_transformation(args);
        process_categorical_variables(args);
        init(args);

        this.is_vertical = args.bar_orientation === 'vertical';

        if (this.is_vertical) {
            x_axis_categorical(args);
            y_axis(args);
        } else {
            x_axis(args);
            y_axis_categorical(args);
        }
        return this;
    };

    this.mainPlot = function() {
        var svg = d3.select(args.target).select('svg');
        var data = args.data[0];
        var barplot = svg.select('.mg-barplot');
        var fresh_render = barplot.empty();

        var bars;
        var predictor_bars;
        var pp, pp0;
        var baseline_marks;

        var perform_load_animation = fresh_render && args.animate_on_load;
        var should_transition = perform_load_animation || args.transition_on_update;
        var transition_duration = args.transition_duration || 1000;

        // draw the plot on first render
        if (fresh_render) {
            barplot = svg.append('g')
                .classed('mg-barplot', true);

            bars = barplot.selectAll('.mg-bar')
                        .data(data)
                        .enter()
                    .append('rect')
                        .classed('mg-bar', true);

            if (args.predictor_accessor) {
                predictor_bars = barplot.selectAll('.mg-bar-prediction')
                        .data(data)
                        .enter()
                    .append('rect')
                        .classed('mg-bar-prediction', true);
            }

            if (args.baseline_accessor) {
                baseline_marks = barplot.selectAll('.mg-bar-baseline')
                        .data(data)
                        .enter()
                    .append('line')
                    .classed('mg-bar-baseline', true);
            }
        }
        // setup vars with the existing elements
        // TODO: deal with changing data sets - i.e. more/less, different labels etc.
        else {
            barplot = svg.select('g.mg-barplot');

            // move the barplot after the axes so it doesn't overlap
            $(svg.node()).find('.mg-y-axis').after($(barplot.node()).detach());

            bars = barplot.selectAll('rect.mg-bar');

            if (args.predictor_accessor) {
                predictor_bars = barplot.selectAll('.mg-bar-prediction');
            }

            if (args.baseline_accessor) {
                baseline_marks = barplot.selectAll('.mg-bar-baseline');
            }
        }

        var appropriate_size;

        if (this.is_vertical) {
            appropriate_size = args.scales.X.rangeBand()/1.5;

            if (perform_load_animation) {
                bars.attr('height', 0)
                    .attr('y', args.scales.Y(0));
            }

            if (should_transition) {
                bars = bars.transition()
                    .duration(transition_duration);
            }

            bars.attr('y', function(d) {
                    return args.scales.Y(0) - (args.scales.Y(0) - args.scalefns.yf(d));
                })
                .attr('x', function(d) {
                    return args.scalefns.xf(d) + appropriate_size/2;
                })
                .attr('width', appropriate_size)
                .attr('height', function(d) {
                    return 0 - (args.scalefns.yf(d) - args.scales.Y(0));
                });

            if (args.predictor_accessor) {
                pp = args.predictor_proportion;
                pp0 = pp-1;

                if (perform_load_animation) {
                    predictor_bars.attr('height', 0)
                        .attr('y', args.scales.Y(0));
                }

                if (should_transition) {
                    predictor_bars = predictor_bars.transition()
                        .duration(transition_duration);
                }

                // thick line  through bar;
                predictor_bars
                    .attr('y', function(d) {
                        return args.scales.Y(0) - (args.scales.Y(0) - args.scales.Y(d[args.predictor_accessor]));
                    })
                    .attr('x', function(d) {
                        return args.scalefns.xf(d) + pp0*appropriate_size/(pp*2) + appropriate_size/2;
                    })
                    .attr('width', appropriate_size/pp)
                    .attr('height', function(d) {
                        return 0 - (args.scales.Y(d[args.predictor_accessor]) - args.scales.Y(0));
                    });
            }

            if (args.baseline_accessor) {
                pp = args.predictor_proportion;

                if (perform_load_animation) {
                    baseline_marks.attr({y1: args.scales.Y(0), y2: args.scales.Y(0)});
                }

                if (should_transition) {
                    baseline_marks = baseline_marks.transition()
                        .duration(transition_duration);
                }

                baseline_marks
                    .attr('x1', function(d) {
                        return args.scalefns.xf(d)+appropriate_size/2-appropriate_size/pp + appropriate_size/2;
                    })
                    .attr('x2', function(d) {
                        return args.scalefns.xf(d)+appropriate_size/2+appropriate_size/pp + appropriate_size/2;
                    })
                    .attr('y1', function(d) { return args.scales.Y(d[args.baseline_accessor]); })
                    .attr('y2', function(d) { return args.scales.Y(d[args.baseline_accessor]); });
            }
        } else {
            appropriate_size = args.scales.Y.rangeBand()/1.5;

            if (perform_load_animation) {
                bars.attr('width', 0);
            }

            if (should_transition) {
                bars = bars.transition()
                    .duration(transition_duration);
            }

            bars.attr('x', args.scales.X(0))
                .attr('y', function(d) {
                    return args.scalefns.yf(d) + appropriate_size/2;
                })
                .attr('height', appropriate_size)
                .attr('width', function(d) {
                    return args.scalefns.xf(d) - args.scales.X(0);
                });


            if (args.predictor_accessor) {
                pp = args.predictor_proportion;
                pp0 = pp-1;

                if (perform_load_animation) {
                    predictor_bars.attr('width', 0);
                }

                if (should_transition) {
                    predictor_bars = predictor_bars.transition()
                        .duration(transition_duration);
                }

                // thick line  through bar;
                predictor_bars
                    .attr('x', args.scales.X(0))
                    .attr('y', function(d) {
                        return args.scalefns.yf(d) + pp0 * appropriate_size/(pp*2) + appropriate_size / 2;
                    })
                    .attr('height', appropriate_size / pp)
                    .attr('width', function(d) {
                        return args.scales.X(d[args.predictor_accessor]) - args.scales.X(0);
                    });
            }

            if (args.baseline_accessor) {
                pp = args.predictor_proportion;

                if (perform_load_animation) {
                    baseline_marks
                        .attr({x1: args.scales.X(0), x2: args.scales.X(0)});
                }

                if (should_transition) {
                    baseline_marks = baseline_marks.transition()
                        .duration(transition_duration);
                }

                baseline_marks
                    .attr('x1', function(d) { return args.scales.X(d[args.baseline_accessor]); })
                    .attr('x2', function(d) { return args.scales.X(d[args.baseline_accessor]); })
                    .attr('y1', function(d) {
                        return args.scalefns.yf(d) + appropriate_size / 2 - appropriate_size / pp + appropriate_size / 2;
                    })
                    .attr('y2', function(d) {
                        return args.scalefns.yf(d) + appropriate_size / 2 + appropriate_size / pp + appropriate_size / 2;
                    });
            }
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
        $svg.find('.mg-active-datapoint').remove();

        //rollover text
        svg.append('text')
            .attr('class', 'mg-active-datapoint')
            .attr('xml:space', 'preserve')
            .attr('x', args.width - args.right)
            .attr('y', args.top / 2)
            .attr('dy', '.35em')
            .attr('text-anchor', 'end');

        g = svg.append('g')
            .attr('class', 'mg-rollover-rect');

        //draw rollover bars
        var bar = g.selectAll(".mg-bar-rollover")
            .data(args.data[0]).enter()
            .append("rect")
              .attr('class', 'mg-bar-rollover');

        if (this.is_vertical) {
            bar.attr("x", args.scalefns.xf)
                .attr("y", function() {
                    return args.scales.Y(0) - args.height;
                })
                .attr('width', args.scales.X.rangeBand())
                .attr('height', args.height)
                .attr('opacity', 0)
                .on('mouseover', this.rolloverOn(args))
                .on('mouseout', this.rolloverOff(args))
                .on('mousemove', this.rolloverMove(args));
        } else {
            bar.attr("x", args.scales.X(0))
                .attr("y", args.scalefns.yf)
                .attr('width', args.width)
                .attr('height', args.scales.Y.rangeBand()+2)
                .attr('opacity', 0)
                .on('mouseover', this.rolloverOn(args))
                .on('mouseout', this.rolloverOff(args))
                .on('mousemove', this.rolloverMove(args));
        }
        return this;
    };

    this.rolloverOn = function(args) {
        var svg = d3.select($(args.target).find('svg').get(0));
        var label_accessor = this.is_vertical ? args.x_accessor : args.y_accessor;
        var data_accessor = this.is_vertical ? args.y_accessor : args.x_accessor;
        var label_units = this.is_vertical ? args.yax_units : args.xax_units;

        return function(d, i) {
            svg.selectAll('text')
                .filter(function(g, j) {
                    return d === g;
                })
                .attr('opacity', 0.3);

            var fmt = d3.time.format('%b %e, %Y');
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

            //highlight active bar
            d3.selectAll($(args.target + ' svg g.mg-barplot .mg-bar:eq(' + i + ')'))
                .classed('active', true);

            //update rollover text
            if (args.show_rollover_text) {
                svg.select('.mg-active-datapoint')
                    .text(function() {
                        if (args.time_series) {
                            var dd = new Date(+d[data_accessor]);
                            dd.setDate(dd.getDate());

                            return fmt(dd) + '  ' + label_units + num(d[label_accessor]);
                        } else {
                            return d[label_accessor] + ': ' + num(d[data_accessor]);
                        }
                    });
            }

            if (args.mouseover) {
                args.mouseover(d, i);
            }
        };
    };

    this.rolloverOff = function(args) {
        var svg = d3.select($(args.target).find('svg').get(0));

        return function(d, i) {
            //reset active bar
            d3.selectAll($(args.target).find('svg g.mg-barplot .mg-bar:eq(' + i + ')'))
                .classed('active', false);

            //reset active data point text
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
