(function() {
  'use strict';

  // barchart re-write.
function mg_targeted_legend (args) {
  var plot = '';
  if (args.legend_target) {

    var div = d3.select(args.legend_target).append('div').classed('mg-bar-target-legend', true);
    var labels = args.categorical_variables;
    labels.forEach(function(label){
      var outer_span = div.append('span').classed('mg-bar-target-element', true);
      outer_span.append('span')
        .classed('mg-bar-target-legend-shape', true)
        .style('color', args.scales.color(label))
        .text('\u25FC ');
      outer_span.append('span')
        .classed('mg-bar-target-legend-text', true)
        .text(label)

    });
  }
}

  function legend_on_graph (svg, args) {
    // draw each element at the top right
    // get labels
    var labels = args.categorical_variables;
    var lineCount = 0;
    var lineHeight = 1.1;
    var g = svg.append('g').classed("mg-bar-legend", true);
    var textContainer = g.append('text');
    textContainer
      .selectAll('*')
      .remove();
    textContainer
      .attr('width', args.right)
      .attr('height', 100)
      .attr('text-anchor', 'start');


    labels.forEach(function(label){
      var sub_container = textContainer.append('tspan')
            .attr('x', mg_get_plot_right(args))
            .attr('y', args.height/2)
            .attr('dy', (lineCount * lineHeight) + 'em');
      sub_container.append('tspan')
            .text('\u25a0 ')
            .attr('fill', args.scales.color(label))
            .attr('font-size', 20)
      sub_container.append('tspan')
            .text(label)
            .attr('font-weight', 300)
            .attr('font-size', 10);
      lineCount++;

    })

    // d.values.forEach(function (datum) {
    //   formatted_y = mg_format_y_rollover(args, num, datum);

    //   if (args.y_rollover_format !== null) {
    //     formatted_y = number_rollover_format(args.y_rollover_format, datum, args.y_accessor);
    //   } else {
    //     formatted_y = args.yax_units + num(datum[args.y_accessor]);
    //   }

    //   sub_container = textContainer.append('tspan').attr('x', 0).attr('y', (lineCount * lineHeight) + 'em');
    //   formatted_y = mg_format_y_rollover(args, num, datum);
    //   mouseover_tspan(sub_container, '\u2014  ')
    //     .color(args, datum);
    //   mouseover_tspan(sub_container, formatted_x + ' ' + formatted_y);

    //   lineCount++;
    // });
  }

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
      // work in progress. If grouped bars, add color scale.
      mg_bar_color_scale(args);

      this.mainPlot();
      this.markers();
      this.rollover();
      this.windowListeners();
      //if (args.scaffold) scaffold(args);
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

      bars = barplot.selectAll('.mg-bar')
        .data(data);

      bars.exit().remove();

      bars.enter().append('rect')
        .classed('mg-bar', true)
        .classed('default-bar', args.scales.hasOwnProperty('color') ? false : true);
      // add new white lines.
      // barplot.selectAll('invisible').data(args.scales.X.ticks()).enter().append('svg:line')
      //   .attr('x1', args.scales.X)
      //   .attr('x2', args.scales.X)
      //   .attr('y1', mg_get_plot_top(args))
      //   .attr('y2', mg_get_plot_bottom(args))
      //   .attr('stroke', 'white');

      if (args.predictor_accessor) {
        predictor_bars = barplot.selectAll('.mg-bar-prediction')
          .data(data.filter(function(d){return d.hasOwnProperty(args.predictor_accessor)}));

        predictor_bars.exit().remove();

        predictor_bars.enter().append('rect')
          .classed('mg-bar-prediction', true);
      }

      if (args.baseline_accessor) {
        baseline_marks = barplot.selectAll('.mg-bar-baseline')
          .data(data.filter(function(d){return d.hasOwnProperty(args.baseline_accessor)}));

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
        // appropriate_size = args.scales.X.rangeBand()/1.5;

        // if (perform_load_animation) {
        //   bars.attr({
        //     height: 0,
        //     y: args.scales.Y(0)
        //   });

        //   if (predictor_bars) {
        //     predictor_bars.attr({
        //       height: 0,
        //       y: args.scales.Y(0)
        //     });
        //   }

        //   if (baseline_marks) {
        //     baseline_marks.attr({
        //       y1: args.scales.Y(0),
        //       y2: args.scales.Y(0)
        //     });
        //   }
        // }

        // bars.attr('y', args.scalefns.yf)
        //   .attr('x', function(d) {
        //     return args.scalefns.xf(d)// + appropriate_size/2;
        //   })
        //   .attr('width', appropriate_size)
        //   .attr('height', function(d) {
        //     return 0 - (args.scalefns.yf(d) - args.scales.Y(0));
        //   });


        // if (args.predictor_accessor) {
        //   pp = args.predictor_proportion;
        //   pp0 = pp-1;

        //   // thick line through bar;
        //   predictor_bars
        //     .attr('y', function(d) {
        //       return args.scales.Y(0) - (args.scales.Y(0) - args.scales.Y(d[args.predictor_accessor]));
        //     })
        //     .attr('x', function(d) {
        //       return args.scalefns.xf(d) + pp0*appropriate_size/(pp*2) + appropriate_size/2;
        //     })
        //     .attr('width', appropriate_size/pp)
        //     .attr('height', function(d) {
        //       return 0 - (args.scales.Y(d[args.predictor_accessor]) - args.scales.Y(0));
        //     });
        // }

        // if (args.baseline_accessor) {
        //   pp = args.predictor_proportion;

        //   baseline_marks
        //     .attr('x1', function(d) {
        //       return args.scalefns.xf(d)+appropriate_size/2-appropriate_size/pp + appropriate_size/2;
        //     })
        //     .attr('x2', function(d) {
        //       return args.scalefns.xf(d)+appropriate_size/2+appropriate_size/pp + appropriate_size/2;
        //     })
        //     .attr('y1', function(d) { return args.scales.Y(d[args.baseline_accessor]); })
        //     .attr('y2', function(d) { return args.scales.Y(d[args.baseline_accessor]); });
        // }
      } else {
        //appropriate_size = args.scales.Y_ingroup.rangeBand()/1.5;
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

        bars.attr('x', function(d) {
          var x = args.scales.X(0);
          if (d[args.x_accessor] < 0) {
            x = args.scalefns.xf(d);
          } return x;
        })
          .attr('y', function(d) {
            return args.scalefns.yf_in(d) + args.scalefns.yf_out(d);// + appropriate_size/2;
          })
          .attr('fill', args.scalefns.color)
          .attr('height', args.scales.Y_ingroup.rangeBand())
          .attr('width', function(d) {
            return Math.abs(args.scalefns.xf(d) - args.scales.X(0));
          });

        if (args.predictor_accessor) {
          // pp = args.predictor_proportion;
          // pp0 = pp-1;

          // thick line  through bar;
          predictor_bars
            .attr('x', args.scales.X(0))
            .attr('y', function(d) {
              return args.scalefns.yf_out(d) + args.scalefns.yf_in(d) + args.scales.Y_ingroup.rangeBand() * (7/16)// + pp0 * appropriate_size/(pp*2) + appropriate_size / 2;
            })
            .attr('height', args.scales.Y_ingroup.rangeBand()/8)//appropriate_size / pp)
            .attr('width', function(d) {
              return args.scales.X(d[args.predictor_accessor]) - args.scales.X(0);
            });
        }

        if (args.baseline_accessor) {

          baseline_marks
            .attr('x1', function(d) { return args.scales.X(d[args.baseline_accessor]); })
            .attr('x2', function(d) { return args.scales.X(d[args.baseline_accessor]); })
            .attr('y1', function(d) {
              return args.scalefns.yf_out(d) + args.scalefns.yf_in(d) + args.scales.Y_ingroup.rangeBand()/4
            })
            .attr('y2', function(d) {
              return args.scalefns.yf_out(d) + args.scalefns.yf_in(d) + args.scales.Y_ingroup.rangeBand()*3/4
            });
        }
      }
      if (args.legend && args.group_accessor && args.color_accessor !== false && args.group_accessor !== args.color_accessor) {
        if (!args.legend_target) legend_on_graph(svg, args);
        else mg_targeted_legend(args);
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

      mg_add_g(svg, 'mg-active-datapoint-container');

      //remove the old rollovers if they already exist
      svg.selectAll('.mg-rollover-rect').remove();
      svg.selectAll('.mg-active-datapoint').remove();

      //rollover text
      var rollover_x, rollover_anchor;
      if (args.rollover_align === 'right') {
        rollover_x = args.width-args.right;
        rollover_anchor = 'end';
      } else if (args.rollover_align === 'left') {
        rollover_x = args.left;
        rollover_anchor = 'start';
      } else {
        // middle
        rollover_x = (args.width - args.left - args.right) / 2 + args.left;
        rollover_anchor = 'middle';
      }

      svg.append('text')
        .attr('class', 'mg-active-datapoint')
        .attr('xml:space', 'preserve')
        .attr('x', rollover_x)
        .attr('y', args.top * 0.75)
        .attr('dy', '.35em')
        .attr('text-anchor', rollover_anchor);

      g = svg.append('g')
        .attr('class', 'mg-rollover-rect');

      //draw rollover bars
      var bar = g.selectAll(".mg-bar-rollover")
        .data(args.data[0]).enter()
        .append("rect")
          .attr('class', 'mg-bar-rollover');

      if (this.is_vertical) {
        // bar.attr("x", args.scalefns.xf)
        //   .attr("y", function() {
        //     return args.scales.Y(0) - args.height;
        //   })
        //   .attr('width', args.scales.X.rangeBand())
        //   .attr('height', args.height)
        //   .attr('opacity', 0)
        //   .on('mouseover', this.rolloverOn(args))
        //   .on('mouseout', this.rolloverOff(args))
        //   .on('mousemove', this.rolloverMove(args));
      } else {
        bar.attr("x", mg_get_plot_left(args))
          .attr("y", function(d){
            return args.scalefns.yf_in(d) + args.scalefns.yf_out(d);
          })
          .attr('width', mg_get_plot_right(args) - mg_get_plot_left(args))
          .attr('height', args.scales.Y_ingroup.rangeBand())
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
        // svg.selectAll('text')
        //   .filter(function(g, j) {
        //     return d === g;
        //   })
        //   .attr('opacity', 0.3);

        var fmt = MG.time_format(args.utc_time, '%b %e, %Y');
        var num = format_rollover_number(args);

        //highlight active bar
        var bar = svg.selectAll('g.mg-barplot .mg-bar')
          .filter(function(d, j) {
            return j === i;
          }).classed('active', true);
        if (args.scales.hasOwnProperty('color')) {
          bar.attr('fill', d3.rgb(args.scalefns.color(d)).darker());
        } else {
          bar.classed('default-active', true);
        }

        //update rollover text
        if (args.show_rollover_text) {
          var mouseover = mg_mouseover_text(args, {svg: svg});
          var row = mouseover.mouseover_row();

          if (args.group_accessor)  row.text(d[args.group_accessor] + '   ').bold();

          row.text(mg_format_x_mouseover(args, d));
          row.text(args.y_accessor + ': ' + d[args.y_accessor]);
          if (args.predictor_accessor || args.baseline_accessor) {
            row = mouseover.mouseover_row();

            if (args.predictor_accessor) row.text(mg_format_data_for_mouseover(args, d, null, args.predictor_accessor, false))
            if (args.baseline_accessor) row.text(mg_format_data_for_mouseover(args, d, null, args.baseline_accessor, false))
          }
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
        var bar = svg.selectAll('g.mg-barplot .mg-bar.active').classed('active', false);

        if (args.scales.hasOwnProperty('color')) {
          bar.attr('fill', args.scalefns.color(d));
        } else {
          bar.classed('default-active', false);
        }

        //reset active data point text
        svg.select('.mg-active-datapoint')
          .text('');

        mg_clear_mouseover_container(svg);

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
    secondary_label_accessor: null,
    x_extended_ticks: true,
    color_accessor: null,
    color_type: 'category',
    color_domain: null,
    legend: true,
    legend_target: null,
    mouseover_align: 'middle',
    baseline_accessor: null,
    predictor_accessor: null,
    predictor_proportion: 5,
    show_bar_zero: true,
    binned: true,
    width: 480,
    height:null,
    bar_padding_percentage: 0.05,
    bar_outer_padding_percentage: .1,
    group_padding_percentage:.25,
    group_outer_padding_percentage: 0,
    bar_thickness: 12,
    top: 45,
    left: 105,
    right:65,
    truncate_x_labels: true,
    truncate_y_labels: true,
    rotate_x_labels: 0,
    rotate_y_labels: 0
  };

  MG.register('bar', barChart, defaults);

}).call(this);
