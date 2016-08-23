(function() {
  'use strict';

  // TODO add styles to stylesheet instead
  function scaffold(args) {
    var svg = mg_get_svg_child_of(args.target);
    // main margins
    svg.append('line')
      .attr('x1', 0)
      .attr('x2', args.width)
      .attr('y1', args.top)
      .attr('y2', args.top)
      .attr('stroke', 'black');
    svg.append('line')
      .attr('x1', 0)
      .attr('x2', args.width)
      .attr('y1', args.height-args.bottom)
      .attr('y2', args.height-args.bottom)
      .attr('stroke', 'black');

    svg.append('line')
      .attr('x1', args.left)
      .attr('x2', args.left)
      .attr('y1', 0)
      .attr('y2', args.height)
      .attr('stroke', 'black');

    svg.append('line')
      .attr('x1', args.width-args.right)
      .attr('x2', args.width-args.right)
      .attr('y1', 0)
      .attr('y2', args.height)
      .attr('stroke', 'black');

    // plot area margins
    svg.append('line')
      .attr('x1', 0)
      .attr('x2', args.width)
      .attr('y1', args.height-args.bottom-args.buffer)
      .attr('y2', args.height-args.bottom-args.buffer)
      .attr('stroke', 'gray');

    svg.append('line')
      .attr('x1', 0)
      .attr('x2', args.width)
      .attr('y1', args.top+args.buffer)
      .attr('y2', args.top+args.buffer)
      .attr('stroke', 'gray');

    svg.append('line')
      .attr('x1', args.left + args.buffer)
      .attr('x2', args.left + args.buffer)
      .attr('y1', 0)
      .attr('y2', args.height)
      .attr('stroke', 'gray');
    svg.append('line')
      .attr('x1', args.width -args.right - args.buffer)
      .attr('x2', args.width -args.right - args.buffer)
      .attr('y1', 0)
      .attr('y2', args.height)
      .attr('stroke', 'gray');
  }

  // barchart re-write.
  function mg_targeted_legend(args) {
    var labels;
    var plot = '';
    if (args.legend_target) {

      var div = d3.select(args.legend_target).append('div').classed('mg-bar-target-legend', true);
      
      if (args.orientation == 'horizontal') labels = args.scales.Y.domain()
      else labels = args.scales.X.domain();

      labels.forEach(function(label) {
        var outer_span = div.append('span').classed('mg-bar-target-element', true);
        outer_span.append('span')
          .classed('mg-bar-target-legend-shape', true)
          .style('color', args.scales.COLOR(label))
          .text('\u25FC ');
        outer_span.append('span')
          .classed('mg-bar-target-legend-text', true)
          .text(label);

      });
    }
  }

  function legend_on_graph(svg, args) {
    // draw each element at the top right
    // get labels

    var labels;
    if (args.orientation=='horizontal') labels = args.scales.Y.domain()
    else labels = args.scales.X.domain();

    var lineCount = 0;
    var lineHeight = 1.1;
    var g = svg.append('g').classed("mg-bar-legend", true);
    var textContainer = g.append('text');

    //

    textContainer
      .selectAll('*')
      .remove();
    textContainer
      .attr('width', args.right)
      .attr('height', 100)
      .attr('text-anchor', 'start');

    labels.forEach(function(label) {
      var sub_container = textContainer.append('tspan')
        .attr('x', mg_get_plot_right(args))
        .attr('y', args.height / 2)
        .attr('dy', (lineCount * lineHeight) + 'em');
      sub_container.append('tspan')
        .text('\u25a0 ')
        .attr('fill', args.scales.COLOR(label))
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
      args.x_axis_type = mg_infer_type(args, 'x');
      args.y_axis_type = mg_infer_type(args, 'y');

      // this is specific to how rects work in svg, let's keep track of the bar orientation to
      // plot appropriately.
      if (args.x_axis_type == 'categorical') {
        args.orientation = 'vertical';
      } else if (args.y_axis_type == 'categorical') {
        args.orientation = 'horizontal';
      } else if (args.x_axis_type != 'categorical' && args.y_axis_type != 'categorical') {
        // histogram.
        args.orientation = 'vertical';
      }

      raw_data_transformation(args);

      process_point(args);
      init(args);

      var xMaker, yMaker;

      if (args.x_axis_type === 'categorical') {
        xMaker = MG.scale_factory(args)
          .namespace('x')
          .categoricalDomainFromData()
          .categoricalRangeBands([0, args.xgroup_height], args.xgroup_accessor === null);

        if (args.xgroup_accessor) {
          new MG.scale_factory(args)
            .namespace('xgroup')
            .categoricalDomainFromData()
            .categoricalRangeBands('bottom');

        } else {
          args.scales.XGROUP = function(d) {
            return mg_get_plot_left(args) };
          args.scalefns.xgroupf = function(d) {
            return mg_get_plot_left(args) };
        }

        args.scalefns.xoutf = function(d) {
          return args.scalefns.xf(d) + args.scalefns.xgroupf(d)
        };
      } else {
        xMaker = MG.scale_factory(args)
          .namespace('x')
          .inflateDomain(true)
          .zeroBottom(args.y_axis_type === 'categorical')
          .numericalDomainFromData((args.baselines || []).map(function(d) {
            return d[args.x_accessor] }))
          .numericalRange('bottom');

        args.scalefns.xoutf = args.scalefns.xf;
      }

      // y-scale generation. This needs to get simplified.
      if (args.y_axis_type === 'categorical') {
        yMaker = MG.scale_factory(args)
          .namespace('y')
          .zeroBottom(true)
          .categoricalDomainFromData()
          .categoricalRangeBands([0, args.ygroup_height], true);

        if (args.ygroup_accessor) {

          new MG.scale_factory(args)
            .namespace('ygroup')
            .categoricalDomainFromData()
            .categoricalRangeBands('left');

        } else {
          args.scales.YGROUP = function() {
            return mg_get_plot_top(args) };
          args.scalefns.ygroupf = function(d) {
            return mg_get_plot_top(args) };

        }
        args.scalefns.youtf = function(d) {
          return args.scalefns.yf(d) + args.scalefns.ygroupf(d) };

      } else {
        var baselines = (args.baselines || []).map(function(d) {
          return d[args.y_accessor] });

        yMaker = MG.scale_factory(args)
          .namespace('y')
          .inflateDomain(true)
          .zeroBottom(args.x_axis_type === 'categorical')
          .numericalDomainFromData(baselines)
          .numericalRange('left');

        args.scalefns.youtf = function(d) {
          return args.scalefns.yf(d) };
      }

      if (args.ygroup_accessor !== null) {
        args.ycolor_accessor = args.y_accessor;
        MG.scale_factory(args)
          .namespace('ycolor')
          .scaleName('color')
          .categoricalDomainFromData()
          .categoricalColorRange();
      }

      if (args.xgroup_accessor !== null) {
        args.xcolor_accessor = args.x_accessor;
        MG.scale_factory(args)
          .namespace('xcolor')
          .scaleName('color')
          .categoricalDomainFromData()
          .categoricalColorRange();
      }

      // if (args.ygroup_accessor !== null) {
      //   MG.scale_factory(args)
      //     .namespace('ygroup')
      //     .categoricalDomainFromData()
      //     .categoricalColorRange();
      // }

      new MG.axis_factory(args)
        .namespace('x')
        .type(args.x_axis_type)
        .zeroLine(args.y_axis_type === 'categorical')
        .position(args.x_axis_position)
        .draw();

      new MG.axis_factory(args)
        .namespace('y')
        .type(args.y_axis_type)
        .zeroLine(args.x_axis_type === 'categorical')
        .position(args.y_axis_position)
        .draw();

      //mg_categorical_group_color_scale(args);

      this.mainPlot();
      this.markers();
      this.rollover();
      this.windowListeners();
      //scaffold(args)

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
        .data(data)
        .enter()
        .append('rect')
          .classed('mg-bar', true)
          .classed('default-bar', args.scales.hasOwnProperty('COLOR') ? false : true);

      // TODO - reimplement

      // reference_accessor {}

      // if (args.predictor_accessor) {
      //   predictor_bars = barplot.selectAll('.mg-bar-prediction')
      //     .data(data.filter(function(d) {
      //       return d.hasOwnProperty(args.predictor_accessor) }));

      //   predictor_bars.exit().remove();

      //   predictor_bars.enter().append('rect')
      //     .classed('mg-bar-prediction', true);
      // }

      // if (args.baseline_accessor) {
      //   baseline_marks = barplot.selectAll('.mg-bar-baseline')
      //     .data(data.filter(function(d) {
      //       return d.hasOwnProperty(args.baseline_accessor) }));

      //   baseline_marks.exit().remove();

      //   baseline_marks.enter().append('line')
      //     .classed('mg-bar-baseline', true);
      // }

      var appropriate_size;

      // setup transitions
      // if (should_transition) {
      //   bars = bars.transition()
      //     .duration(transition_duration);

      //   if (predictor_bars) {
      //     predictor_bars = predictor_bars.transition()
      //       .duration(transition_duration);
      //   }

      //   if (baseline_marks) {
      //     baseline_marks = baseline_marks.transition()
      //       .duration(transition_duration);
      //   }
      // }

      //appropriate_size = args.scales.Y_ingroup.rangeBand()/1.5;
      var length, width, length_type, width_type, length_coord, width_coord,
          length_scalefn, width_scalefn, length_scale, width_scale,
          length_accessor, width_accessor, length_coord_map, width_coord_map,
          length_map, width_map;

      var reference_length_map, reference_length_coord_fn;

      if (args.orientation == 'vertical') {
        length = 'height';
        width = 'width';
        length_type = args.y_axis_type;
        width_type = args.x_axis_type;
        length_coord = 'y';
        width_coord = 'x';
        length_scalefn = length_type == 'categorical' ? args.scalefns.youtf : args.scalefns.yf;
        width_scalefn  = width_type == 'categorical' ? args.scalefns.xoutf : args.scalefns.xf;
        length_scale   = args.scales.Y;
        width_scale     = args.scales.X;
        length_accessor = args.y_accessor;
        width_accessor = args.x_accessor;

        length_coord_map = function(d) {
          var l;
          l = length_scalefn(d);
          if (d[length_accessor] < 0) {
            l = length_scale(0);
          }
          return l;
        }

        length_map = function(d) {
          return Math.abs(length_scalefn(d) - length_scale(0));
        }

        reference_length_map = function(d) {
          return Math.abs(length_scale(d[args.reference_accessor]) - length_scale(0));
        }

        reference_length_coord_fn = function(d){
          return length_scale(d[args.reference_accessor]);
        }
      }

      if (args.orientation == 'horizontal') {
        length = 'width';
        width = 'height';
        length_type = args.x_axis_type;
        width_type = args.y_axis_type;
        length_coord = 'x';
        width_coord = 'y';
        length_scalefn = length_type == 'categorical' ? args.scalefns.xoutf : args.scalefns.xf;
        width_scalefn = width_type == 'categorical' ? args.scalefns.youtf : args.scalefns.yf;
        length_scale = args.scales.X;
        width_scale = args.scales.Y;
        length_accessor = args.x_accessor;
        width_accessor = args.y_accessor;

        length_coord_map = function(d) {
          var l;
          l = length_scale(0);
          return l;
        }

        length_map = function(d) {
          return Math.abs(length_scalefn(d) - length_scale(0));
        }

        reference_length_map = function(d) {
          return Math.abs(length_scale(d[args.reference_accessor]) - length_scale(0));
        }

        reference_length_coord_fn = function(d){
          return length_scale(0);
        }
      }

      // if (perform_load_animation) {
      //   bars.attr(length, 0);

      //   if (predictor_bars) {
      //     predictor_bars.attr(length, 0);
      //   }

      //   // if (baseline_marks) {
      //   //   baseline_marks.attr({
      //   //     x1: args.scales.X(0),
      //   //     x2: args.scales.X(0)
      //   //   });
      //   // }
      // }

      bars.attr(length_coord, length_coord_map);

      // bars.attr(length_coord, 40)
      //bars.attr(width_coord, 70)



      bars.attr(width_coord, function(d) {
        var w;
        if (width_type == 'categorical') {
          w = width_scalefn(d);
        } else {
          w = width_scale(0);
          if (d[width_accessor] < 0) {
            w = width_scalefn(d);
          }
        }
        w = w - args.bar_thickness/2;
        return w;
      });

      if (args.scales.COLOR) {
        bars.attr('fill', args.scalefns.colorf)
      }

      bars
        .attr(length, length_map)
        .attr(width, function(d) {
          return args.bar_thickness;
      });




      if (args.reference_accessor !== null) {
        var reference_data = data.filter(function(d){
          return d.hasOwnProperty(args.reference_accessor);
        })
        var reference_bars = barplot.selectAll('.mg-categorical-reference')
          .data(reference_data)
          .enter()
          .append('rect');

        reference_bars
          .attr(length_coord, reference_length_coord_fn)
          .attr(width_coord, function(d) {
            return width_scalefn(d) - args.reference_thickness/2
          })
          .attr(length, reference_length_map)
          .attr(width, args.reference_thickness);
      }

      if (args.comparison_accessor !== null) {
        var comparison_thickness = null;
        if (args.comparison_thickness === null) {
          comparison_thickness = args.bar_thickness/2;
        } else {
          comparison_thickness = args.comparison_thickness;
        }


        var comparison_data = data.filter(function(d) {
          return d.hasOwnProperty(args.comparison_accessor);
        })
        var comparison_marks = barplot.selectAll('.mg-categorical-comparison')
          .data(comparison_data)
          .enter()
          .append('line');

        comparison_marks
          .attr(length_coord + '1', function(d){return length_scale(d[args.comparison_accessor])})
          .attr(length_coord + '2', function(d){return length_scale(d[args.comparison_accessor])})
          .attr(width_coord + '1',  function(d){
            return width_scalefn(d) - comparison_thickness/2;
          })
          .attr(width_coord + '2', function(d) {
            return width_scalefn(d) + comparison_thickness/2;
          })
          .attr('stroke', 'black')
          .attr('stroke-width', args.comparison_width);
      }

        //bars.attr(width_coord, );
        // bars.attr('width', 50);
        // bars.attr('height', 50);
        // bars.attr('y', function(d){
        //   var y = args.scales.Y(0);
        //   if (d[args.y_accessor] < 0) {
        //     y = args.scalefns.yf(d);
        //   }
        //   return y;
        // });

        // bars.attr('x', function(d){
        //   return 40;
        // })

        // bars.attr('width', function(d){
        //   return 100;
        // });

        // bars.attr('height', 100);

        // bars.attr('fill', 'black');
        // bars.attr('x', function(d) {
        //   var x = args.scales.X(0);
        //   if (d[args.x_accessor] < 0) {
        //     x = args.scalefns.xf(d);
        //   }
        //   return x;
        // })
        // TODO - reimplement.
        // if (args.predictor_accessor) {
        //   predictor_bars
        //     .attr('x', args.scales.X(0))
        //     .attr('y', function(d) {
        //       return args.scalefns.ygroupf(d) + args.scalefns.yf(d) + args.scales.Y.rangeBand() * (7 / 16) // + pp0 * appropriate_size/(pp*2) + appropriate_size / 2;
        //     })
        //     .attr('height', args.scales.Y.rangeBand() / 8) //appropriate_size / pp)
        //     .attr('width', function(d) {
        //       return args.scales.X(d[args.predictor_accessor]) - args.scales.X(0);
        //     });
        // }

      // TODO - reimplement.
      //   if (args.baseline_accessor) {

      //     baseline_marks
      //       .attr('x1', function(d) {
      //         return args.scales.X(d[args.baseline_accessor]); })
      //       .attr('x2', function(d) {
      //         return args.scales.X(d[args.baseline_accessor]); })
      //       .attr('y1', function(d) {
      //         return args.scalefns.ygroupf(d) + args.scalefns.yf(d) + args.scales.Y.rangeBand() / 4
      //       })
      //       .attr('y2', function(d) {
      //         return args.scalefns.ygroupf(d) + args.scalefns.yf(d) + args.scales.Y.rangeBand() * 3 / 4
      //       });
      //   }
        if (args.legend || (args.color_accessor !== null && args.ygroup_accessor !== args.color_accessor)) {
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

      if (svg.selectAll('.mg-active-datapoint-container').nodes().length === 0) {
        mg_add_g(svg, 'mg-active-datapoint-container');
      }

      //remove the old rollovers if they already exist
      svg.selectAll('.mg-rollover-rect').remove();
      svg.selectAll('.mg-active-datapoint').remove();

      // get orientation
      var length, width, length_type, width_type, length_coord, width_coord,
        length_scalefn, width_scalefn, length_scale, width_scale,
        length_accessor, width_accessor;

      var length_coord_map, width_coord_map, length_map, width_map;

      if (args.orientation == 'vertical') {
        length = 'height';
        width = 'width';
        length_type = args.y_axis_type;
        width_type = args.x_axis_type;
        length_coord = 'y';
        width_coord = 'x';
        length_scalefn = length_type == 'categorical' ? args.scalefns.youtf : args.scalefns.yf;
        width_scalefn  = width_type == 'categorical' ? args.scalefns.xoutf : args.scalefns.xf;
        length_scale   = args.scales.Y;
        width_scale     = args.scales.X;
        length_accessor = args.y_accessor;
        width_accessor = args.x_accessor;

        length_coord_map = function(d){
          return mg_get_plot_top(args);
        }

        length_map = function(d) {
          return args.height -args.top-args.bottom-args.buffer*2
        }
      }

      if (args.orientation == 'horizontal') {
        length = 'width';
        width = 'height';
        length_type = args.x_axis_type;
        width_type = args.y_axis_type;
        length_coord = 'x';
        width_coord = 'y';
        length_scalefn = length_type == 'categorical' ? args.scalefns.xoutf : args.scalefns.xf;
        width_scalefn = width_type == 'categorical' ? args.scalefns.youtf : args.scalefns.yf;
        length_scale = args.scales.X;
        width_scale = args.scales.Y;
        length_accessor = args.x_accessor;
        width_accessor = args.y_accessor;

        length_coord_map = function(d){
          var l;
          l = length_scale(0);
          return l;
        }

        length_map = function(d) {
          return args.width -args.left-args.right-args.buffer*2
        }
      }

      //rollover text
      var rollover_x, rollover_anchor;
      if (args.rollover_align === 'right') {
        rollover_x = args.width - args.right;
        rollover_anchor = 'end';
      } else if (args.rollover_align === 'left') {
        rollover_x = args.left;
        rollover_anchor = 'start';
      } else {
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
      var bars = g.selectAll(".mg-bar-rollover")
        .data(args.data[0]).enter()
        .append("rect")
        .attr('class', 'mg-bar-rollover');

      bars.attr('opacity', 0)
        .attr(length_coord, length_coord_map)
        .attr(width_coord, function(d) {
          var w;
          if (width_type == 'categorical') {
            w = width_scalefn(d);
          } else {
            w = width_scale(0);
            if (d[width_accessor] < 0) {
              w = width_scalefn(d);
            }
          }
          w = w - args.bar_thickness/2;
          return w;
        });

      bars.attr(length, length_map)
      bars.attr(width, function(d) {
        return args.bar_thickness;
      });

      bars
        .on('mouseover', this.rolloverOn(args))
        .on('mouseout', this.rolloverOff(args))
        .on('mousemove', this.rolloverMove(args));

      return this;
    };

    this.rolloverOn = function(args) {
      var svg = mg_get_svg_child_of(args.target);
      var label_accessor = this.is_vertical ? args.x_accessor : args.y_accessor;
      var data_accessor = this.is_vertical ? args.y_accessor : args.x_accessor;
      var label_units = this.is_vertical ? args.yax_units : args.xax_units;

      return function(d, i) {

        var fmt = MG.time_format(args.utc_time, '%b %e, %Y');
        var num = format_rollover_number(args);

        //highlight active bar
        var bar = svg.selectAll('g.mg-barplot .mg-bar')
          .filter(function(d, j) {
            return j === i;
          }).classed('active', true);

        if (args.scales.hasOwnProperty('COLOR')) {
          bar.attr('fill', d3.rgb(args.scalefns.colorf(d)).darker());
        } else {
          bar.classed('default-active', true);
        }

        //update rollover text
        if (args.show_rollover_text) {
          var mouseover = mg_mouseover_text(args, { svg: svg });
          var row = mouseover.mouseover_row();

          if (args.ygroup_accessor) row.text(d[args.ygroup_accessor] + '   ').bold();

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

        if (args.scales.hasOwnProperty('COLOR')) {
          bar.attr('fill', args.scalefns.colorf(d));
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
    y_padding_percentage: 0.05, // for categorical scales
    y_outer_padding_percentage: .2, // for categorical scales
    ygroup_padding_percentage: 0, // for categorical scales
    ygroup_outer_padding_percentage: 0, // for categorical scales
    x_padding_percentage: 0.05, // for categorical scales
    x_outer_padding_percentage: .2, // for categorical scales
    xgroup_padding_percentage: 0, // for categorical scales
    xgroup_outer_padding_percentage: 0, // for categorical scales
    buffer: 16,
    y_accessor: 'factor',
    x_accessor: 'value',
    reference_accessor: null,
    comparison_accessor: null,
    secondary_label_accessor: null,
    color_accessor: null,
    color_type: 'category',
    color_domain: null,
    reference_thickness: 1,
    comparison_width: 3,
    comparison_thickness: null,
    legend: false,
    legend_target: null,
    mouseover_align: 'right',
    baseline_accessor: null,
    predictor_accessor: null,
    predictor_proportion: 5,
    show_bar_zero: true,
    binned: true,
    truncate_x_labels: true,
    truncate_y_labels: true
  };

  MG.register('bar', barChart, defaults);

}).call(this);
