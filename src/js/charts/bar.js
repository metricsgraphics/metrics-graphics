(function() {
  'use strict';

  // BARCHART:
  // x - function that processes data
  //   - pass in a feature name, get a count
  //   - have raw feature: value function
  // - need a way of changing the y axis and x axis
  // - need to sort out rollovers
  function barChart(args) {
    this.args = args;

    this.init = function(args) {
      this.args = args;

      raw_data_transformation(args);
      process_categorical_variables(args);
      init(args);

      this.is_vertical = (args.bar_orientation === 'vertical');

      if (this.is_vertical) {
        x_axis_categorical(args);
        y_axis(args);
      } else {
        x_axis(args);
        y_axis_categorical(args);
      }

      this.mainPlot();
      this.markers();
      this.rollover();
      this.windowListeners();

      return this;
    };

    this.mainPlot = function() {
      var svg = mg_get_svg_child_of(args.target);
      var data = args.data[0];
      var barplot = svg.select('g.mg-barplot');
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
      }

      bars = bars = barplot.selectAll('.mg-bar')
        .data(data);

      bars.exit().remove();

      bars.enter().append('rect')
        .classed('mg-bar', true);

      if (args.predictor_accessor) {
        predictor_bars = barplot.selectAll('.mg-bar-prediction')
          .data(data);

        predictor_bars.exit().remove();

        predictor_bars.enter().append('rect')
          .classed('mg-bar-prediction', true);
      }

      if (args.baseline_accessor) {
        baseline_marks = barplot.selectAll('.mg-bar-baseline')
          .data(data);

        baseline_marks.exit().remove();

        baseline_marks.enter().append('line')
          .classed('mg-bar-baseline', true);
      }

      var appropriate_size;

      // setup transitions
      if (should_transition) {
        bars = bars.transition()
          .duration(transition_duration);

        if (predictor_bars) {
          predictor_bars = predictor_bars.transition()
            .duration(transition_duration);
        }

        if (baseline_marks) {
          baseline_marks = baseline_marks.transition()
            .duration(transition_duration);
        }
      }

      // move the barplot after the axes so it doesn't overlap
      svg.select('.mg-y-axis').node().parentNode.appendChild(barplot.node());

      if (this.is_vertical) {
        appropriate_size = args.scales.X.rangeBand()/1.5;

        if (perform_load_animation) {
          bars.attr({
            height: 0,
            y: args.scales.Y(0)
          });

          if (predictor_bars) {
            predictor_bars.attr({
              height: 0,
              y: args.scales.Y(0)
            });
          }

          if (baseline_marks) {
            baseline_marks.attr({
              y1: args.scales.Y(0),
              y2: args.scales.Y(0)
            });
          }
        }

        bars.attr('y', args.scalefns.yf)
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

          // thick line through bar;
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

          if (predictor_bars) {
            predictor_bars.attr('width', 0);
          }

          if (baseline_marks) {
            baseline_marks.attr({
              x1: args.scales.X(0),
              x2: args.scales.X(0)
            });
          }
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
      var svg = mg_get_svg_child_of(args.target);
      var g;

      //remove the old rollovers if they already exist
      svg.selectAll('.mg-rollover-rect').remove();
      svg.selectAll('.mg-active-datapoint').remove();

      //rollover text
      svg.append('text')
        .attr('class', 'mg-active-datapoint')
        .attr('xml:space', 'preserve')
        .attr('x', args.width - args.right)
        .attr('y', args.top * 0.75)
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
      var svg = mg_get_svg_child_of(args.target);
      var label_accessor = this.is_vertical ? args.x_accessor : args.y_accessor;
      var data_accessor = this.is_vertical ? args.y_accessor : args.x_accessor;
      var label_units = this.is_vertical ? args.yax_units : args.xax_units;

      return function(d, i) {
        svg.selectAll('text')
          .filter(function(g, j) {
            return d === g;
          })
          .attr('opacity', 0.3);

        var fmt = MG.time_format(args.utc_time, '%b %e, %Y');
        var num = format_rollover_number(args);

        //highlight active bar
        svg.selectAll('g.mg-barplot .mg-bar')
          .filter(function(d, j) {
            return j === i;
          })
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
      var svg = mg_get_svg_child_of(args.target);

      return function(d, i) {
        //reset active bar
        svg.selectAll('g.mg-barplot .mg-bar')
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
  }

  var defaults = {
    y_accessor: 'factor',
    x_accessor: 'value',
    baseline_accessor: null,
    predictor_accessor: null,
    predictor_proportion: 5,
    dodge_accessor: null,
    binned: true,
    padding_percentage: 0,
    outer_padding_percentage: 0.1,
    height: 500,
    bar_height: 20,
    top: 45,
    left: 70,
    truncate_x_labels: true,
    truncate_y_labels: true,
    rotate_x_labels: 0,
    rotate_y_labels: 0
  };

  MG.register('bar', barChart, defaults);

}).call(this);
