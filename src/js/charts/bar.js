{
  // TODO add styles to stylesheet instead
  function scaffold ({ target, width, height, top, left, right, buffer }) {
    const svg = getSvgChildOf(target)
    // main margins
    svg.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', top)
      .attr('y2', top)
      .attr('stroke', 'black')
    svg.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', height - bottom)
      .attr('y2', height - bottom)
      .attr('stroke', 'black')

    svg.append('line')
      .attr('x1', left)
      .attr('x2', left)
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', 'black')

    svg.append('line')
      .attr('x1', width - right)
      .attr('x2', width - right)
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', 'black')

    // plot area margins
    svg.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', height - bottom - buffer)
      .attr('y2', height - bottom - buffer)
      .attr('stroke', 'gray')

    svg.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', top + buffer)
      .attr('y2', top + buffer)
      .attr('stroke', 'gray')

    svg.append('line')
      .attr('x1', left + buffer)
      .attr('x2', left + buffer)
      .attr('y1', 0)
      .attr('y2', args.height)
      .attr('stroke', 'gray')
    svg.append('line')
      .attr('x1', width - right - buffer)
      .attr('x2', width - right - buffer)
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', 'gray')
  }

  // barchart re-write.
  function mg_targeted_legend ({ legend_target, orientation, scales }) {
    let labels
    const plot = ''
    if (legend_target) {
      const div = d3.select(legend_target).append('div').classed('mg-bar-target-legend', true)

      if (orientation == 'horizontal') labels = scales.Y.domain()
      else labels = scales.X.domain()

      labels.forEach(label => {
        const outer_span = div.append('span').classed('mg-bar-target-element', true)
        outer_span.append('span')
          .classed('mg-bar-target-legend-shape', true)
          .style('color', scales.COLOR(label))
          .text('\u25FC ')
        outer_span.append('span')
          .classed('mg-bar-target-legend-text', true)
          .text(label)
      })
    }
  }

  function legend_on_graph (svg, args) {
    // draw each element at the top right
    // get labels

    let labels
    if (args.orientation == 'horizontal') labels = args.scales.Y.domain()
    else labels = args.scales.X.domain()

    let lineCount = 0
    const lineHeight = 1.1
    const g = svg.append('g').classed('mg-bar-legend', true)
    const textContainer = g.append('text')

    textContainer
      .selectAll('*')
      .remove()
    textContainer
      .attr('width', args.right)
      .attr('height', 100)
      .attr('text-anchor', 'start')

    labels.forEach(label => {
      const sub_container = textContainer.append('tspan')
        .attr('x', getPlotRight(args))
        .attr('y', args.height / 2)
        .attr('dy', `${lineCount * lineHeight}em`)
      sub_container.append('tspan')
        .text('\u25a0 ')
        .attr('fill', args.scales.COLOR(label))
        .attr('font-size', 20)
      sub_container.append('tspan')
        .text(label)
        .attr('font-weight', 300)
        .attr('font-size', 10)
      lineCount++
    })

    // d.values.forEach(function (datum) {
    //   formattedY = formatYRollover(args, num, datum);

    //   if (args.y_rollover_format !== null) {
    //     formattedY = numberRolloverFormat(args.y_rollover_format, datum, args.yAccessor);
    //   } else {
    //     formattedY = args.yaxUnits + num(datum[args.yAccessor]);
    //   }

    //   sub_container = textContainer.append('tspan').attr('x', 0).attr('y', (lineCount * lineHeight) + 'em');
    //   formattedY = formatYRollover(args, num, datum);
    //   mouseover_tspan(sub_container, '\u2014  ')
    //     .color(args, datum);
    //   mouseover_tspan(sub_container, formattedX + ' ' + formattedY);

    //   lineCount++;
    // });
  }

  function barChart (args) {
    this.args = args

    this.init = (args) => {
      this.args = args
      args.xAxis_type = inferType(args, 'x')
      args.yAxis_type = inferType(args, 'y')

      // this is specific to how rects work in svg, let's keep track of the bar orientation to
      // plot appropriately.
      if (args.xAxis_type == 'categorical') {
        args.orientation = 'vertical'
      } else if (args.yAxis_type == 'categorical') {
        args.orientation = 'horizontal'
      } else if (args.xAxis_type != 'categorical' && args.yAxis_type != 'categorical') {
        // histogram.
        args.orientation = 'vertical'
      }

      rawDataTransformation(args)

      processPoint(args)
      init(args)

      let xMaker
      let yMaker

      if (args.xAxis_type === 'categorical') {
        xMaker = MG.scale_factory(args)
          .namespace('x')
          .categoricalDomainFromData()
          .categoricalRangeBands([0, args.xgroup_height], args.xgroup_accessor === null)

        if (args.xgroup_accessor) {
          new MG.scale_factory(args)
            .namespace('xgroup')
            .categoricalDomainFromData()
            .categoricalRangeBands('bottom')
        } else {
          args.scales.XGROUP = d => getPlotLeft(args)
          args.scaleFunctions.xgroupf = d => getPlotLeft(args)
        }

        args.scaleFunctions.xoutf = d => args.scaleFunctions.xf(d) + args.scaleFunctions.xgroupf(d)
      } else {
        xMaker = MG.scale_factory(args)
          .namespace('x')
          .inflateDomain(true)
          .zeroBottom(args.yAxis_type === 'categorical')
          .numericalDomainFromData((args.baselines || []).map(d => d[args.xAccessor]))
          .numericalRange('bottom')

        args.scaleFunctions.xoutf = args.scaleFunctions.xf
      }

      // y-scale generation. This needs to get simplified.
      if (args.yAxis_type === 'categorical') {
        yMaker = MG.scale_factory(args)
          .namespace('y')
          .zeroBottom(true)
          .categoricalDomainFromData()
          .categoricalRangeBands([0, args.yGroupHeight], true)

        if (args.yGroupAccessor) {
          new MG.scale_factory(args)
            .namespace('ygroup')
            .categoricalDomainFromData()
            .categoricalRangeBands('left')
        } else {
          args.scales.YGROUP = () => getPlotTop(args)
          args.scaleFunctions.yGroupFunction = d => getPlotTop(args)
        }
        args.scaleFunctions.youtf = d => args.scaleFunctions.yf(d) + args.scaleFunctions.yGroupFunction(d)
      } else {
        const baselines = (args.baselines || []).map(d => d[args.yAccessor])

        yMaker = MG.scale_factory(args)
          .namespace('y')
          .inflateDomain(true)
          .zeroBottom(args.xAxis_type === 'categorical')
          .numericalDomainFromData(baselines)
          .numericalRange('left')

        args.scaleFunctions.youtf = d => args.scaleFunctions.yf(d)
      }

      if (args.yGroupAccessor !== null) {
        args.ycolorAccessor = args.yAccessor
        MG.scale_factory(args)
          .namespace('ycolor')
          .scaleName('color')
          .categoricalDomainFromData()
          .categoricalColorRange()
      }

      if (args.xgroup_accessor !== null) {
        args.xcolorAccessor = args.xAccessor
        MG.scale_factory(args)
          .namespace('xcolor')
          .scaleName('color')
          .categoricalDomainFromData()
          .categoricalColorRange()
      }

      // if (args.yGroupAccessor !== null) {
      //   MG.scale_factory(args)
      //     .namespace('ygroup')
      //     .categoricalDomainFromData()
      //     .categoricalColorRange();
      // }

      new MG.axis_factory(args)
        .namespace('x')
        .type(args.xAxis_type)
        .zeroLine(args.yAxis_type === 'categorical')
        .position(args.xAxis_position)
        .draw()

      new MG.axis_factory(args)
        .namespace('y')
        .type(args.yAxis_type)
        .zeroLine(args.xAxis_type === 'categorical')
        .position(args.yAxis_position)
        .draw()

      // categoricalGroupColorScale(args);

      this.mainPlot()
      this.markers()
      this.rollover()
      this.windowListeners()
      // scaffold(args)

      return this
    }

    this.mainPlot = () => {
      const svg = getSvgChildOf(args.target)
      const data = args.data[0]
      let barplot = svg.select('g.mg-barplot')
      const fresh_render = barplot.empty()

      let bars, predictor_bars, pp, pp0, baseline_marks

      const perform_load_animation = fresh_render && args.animate_on_load
      const should_transition = perform_load_animation || args.transition_on_update
      const transition_duration = args.transition_duration || 1000

      // draw the plot on first render
      if (fresh_render) {
        barplot = svg.append('g')
          .classed('mg-barplot', true)
      }

      bars = barplot.selectAll('.mg-bar')
        .data(data)
        .enter()
        .append('rect')
        .classed('mg-bar', true)
        .classed('default-bar', !args.scales.hasOwnProperty('COLOR'))

      // TODO - reimplement

      // reference_accessor {}

      // if (args.predictorAccessor) {
      //   predictor_bars = barplot.selectAll('.mg-bar-prediction')
      //     .data(data.filter(function(d) {
      //       return d.hasOwnProperty(args.predictorAccessor) }));

      //   predictor_bars.exit().remove();

      //   predictor_bars.enter().append('rect')
      //     .classed('mg-bar-prediction', true);
      // }

      // if (args.baselineAccessor) {
      //   baseline_marks = barplot.selectAll('.mg-bar-baseline')
      //     .data(data.filter(function(d) {
      //       return d.hasOwnProperty(args.baselineAccessor) }));

      //   baseline_marks.exit().remove();

      //   baseline_marks.enter().append('line')
      //     .classed('mg-bar-baseline', true);
      // }

      let appropriate_size

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

      // appropriate_size = args.scales.Y_ingroup.rangeBand()/1.5;
      let length, width, length_type, width_type, length_coord, width_coord,
        length_scalefn, width_scalefn, length_scale, width_scale,
        length_accessor, width_accessor, length_coord_map, width_coord_map,
        length_map, width_map

      let reference_length_map, reference_length_coord_fn

      if (args.orientation == 'vertical') {
        length = 'height'
        width = 'width'
        length_type = args.yAxis_type
        width_type = args.xAxis_type
        length_coord = 'y'
        width_coord = 'x'
        length_scalefn = length_type == 'categorical' ? args.scaleFunctions.youtf : args.scaleFunctions.yf
        width_scalefn = width_type == 'categorical' ? args.scaleFunctions.xoutf : args.scaleFunctions.xf
        length_scale = args.scales.Y
        width_scale = args.scales.X
        length_accessor = args.yAccessor
        width_accessor = args.xAccessor

        length_coord_map = d => {
          let l
          l = length_scalefn(d)
          if (d[length_accessor] < 0) {
            l = length_scale(0)
          }
          return l
        }

        length_map = d => Math.abs(length_scalefn(d) - length_scale(0))

        reference_length_map = d => Math.abs(length_scale(d[args.reference_accessor]) - length_scale(0))

        reference_length_coord_fn = d => length_scale(d[args.reference_accessor])
      }

      if (args.orientation == 'horizontal') {
        length = 'width'
        width = 'height'
        length_type = args.xAxis_type
        width_type = args.yAxis_type
        length_coord = 'x'
        width_coord = 'y'
        length_scalefn = length_type == 'categorical' ? args.scaleFunctions.xoutf : args.scaleFunctions.xf
        width_scalefn = width_type == 'categorical' ? args.scaleFunctions.youtf : args.scaleFunctions.yf
        length_scale = args.scales.X
        width_scale = args.scales.Y
        length_accessor = args.xAccessor
        width_accessor = args.yAccessor

        length_coord_map = d => {
          let l
          l = length_scale(0)
          return l
        }

        length_map = d => Math.abs(length_scalefn(d) - length_scale(0))

        reference_length_map = d => Math.abs(length_scale(d[args.reference_accessor]) - length_scale(0))

        reference_length_coord_fn = d => length_scale(0)
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

      bars.attr(length_coord, length_coord_map)

      // bars.attr(length_coord, 40)
      // bars.attr(width_coord, 70)

      bars.attr(width_coord, d => {
        let w
        if (width_type == 'categorical') {
          w = width_scalefn(d)
        } else {
          w = width_scale(0)
          if (d[width_accessor] < 0) {
            w = width_scalefn(d)
          }
        }
        w = w - args.bar_thickness / 2
        return w
      })

      if (args.scales.COLOR) {
        bars.attr('fill', args.scaleFunctions.colorFunction)
      }

      bars
        .attr(length, length_map)
        .attr(width, d => args.bar_thickness)

      if (args.reference_accessor !== null) {
        const reference_data = data.filter(d => d.hasOwnProperty(args.reference_accessor))
        const reference_bars = barplot.selectAll('.mg-categorical-reference')
          .data(reference_data)
          .enter()
          .append('rect')

        reference_bars
          .attr(length_coord, reference_length_coord_fn)
          .attr(width_coord, d => width_scalefn(d) - args.reference_thickness / 2)
          .attr(length, reference_length_map)
          .attr(width, args.reference_thickness)
      }

      if (args.comparison_accessor !== null) {
        let comparison_thickness = null
        if (args.comparison_thickness === null) {
          comparison_thickness = args.bar_thickness / 2
        } else {
          comparison_thickness = args.comparison_thickness
        }

        const comparison_data = data.filter(d => d.hasOwnProperty(args.comparison_accessor))
        const comparison_marks = barplot.selectAll('.mg-categorical-comparison')
          .data(comparison_data)
          .enter()
          .append('line')

        comparison_marks
          .attr(`${length_coord}1`, d => length_scale(d[args.comparison_accessor]))
          .attr(`${length_coord}2`, d => length_scale(d[args.comparison_accessor]))
          .attr(`${width_coord}1`, d => width_scalefn(d) - comparison_thickness / 2)
          .attr(`${width_coord}2`, d => width_scalefn(d) + comparison_thickness / 2)
          .attr('stroke', 'black')
          .attr('stroke-width', args.comparison_width)
      }

      // bars.attr(width_coord, );
      // bars.attr('width', 50);
      // bars.attr('height', 50);
      // bars.attr('y', function(d){
      //   var y = args.scales.Y(0);
      //   if (d[args.yAccessor] < 0) {
      //     y = args.scaleFunctions.yf(d);
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
      //   if (d[args.xAccessor] < 0) {
      //     x = args.scaleFunctions.xf(d);
      //   }
      //   return x;
      // })
      // TODO - reimplement.
      // if (args.predictorAccessor) {
      //   predictor_bars
      //     .attr('x', args.scales.X(0))
      //     .attr('y', function(d) {
      //       return args.scaleFunctions.yGroupFunction(d) + args.scaleFunctions.yf(d) + args.scales.Y.rangeBand() * (7 / 16) // + pp0 * appropriate_size/(pp*2) + appropriate_size / 2;
      //     })
      //     .attr('height', args.scales.Y.rangeBand() / 8) //appropriate_size / pp)
      //     .attr('width', function(d) {
      //       return args.scales.X(d[args.predictorAccessor]) - args.scales.X(0);
      //     });
      // }

      // TODO - reimplement.
      //   if (args.baselineAccessor) {

      //     baseline_marks
      //       .attr('x1', function(d) {
      //         return args.scales.X(d[args.baselineAccessor]); })
      //       .attr('x2', function(d) {
      //         return args.scales.X(d[args.baselineAccessor]); })
      //       .attr('y1', function(d) {
      //         return args.scaleFunctions.yGroupFunction(d) + args.scaleFunctions.yf(d) + args.scales.Y.rangeBand() / 4
      //       })
      //       .attr('y2', function(d) {
      //         return args.scaleFunctions.yGroupFunction(d) + args.scaleFunctions.yf(d) + args.scales.Y.rangeBand() * 3 / 4
      //       });
      //   }
      if (args.legend || (args.colorAccessor !== null && args.yGroupAccessor !== args.colorAccessor)) {
        if (!args.legend_target) legend_on_graph(svg, args)
        else mg_targeted_legend(args)
      }
      return this
    }

    this.markers = () => {
      markers(args)
      return this
    }

    this.rollover = () => {
      const svg = getSvgChildOf(args.target)
      let g

      if (svg.selectAll('.mg-active-datapoint-container').nodes().length === 0) {
        addG(svg, 'mg-active-datapoint-container')
      }

      // remove the old rollovers if they already exist
      svg.selectAll('.mg-rollover-rect').remove()
      svg.selectAll('.mg-active-datapoint').remove()

      // get orientation
      let length, width, length_type, width_type, length_coord, width_coord,
        length_scalefn, width_scalefn, length_scale, width_scale,
        length_accessor, width_accessor

      let length_coord_map, width_coord_map, length_map, width_map

      if (args.orientation == 'vertical') {
        length = 'height'
        width = 'width'
        length_type = args.yAxis_type
        width_type = args.xAxis_type
        length_coord = 'y'
        width_coord = 'x'
        length_scalefn = length_type == 'categorical' ? args.scaleFunctions.youtf : args.scaleFunctions.yf
        width_scalefn = width_type == 'categorical' ? args.scaleFunctions.xoutf : args.scaleFunctions.xf
        length_scale = args.scales.Y
        width_scale = args.scales.X
        length_accessor = args.yAccessor
        width_accessor = args.xAccessor

        length_coord_map = d => getPlotTop(args)

        length_map = d => args.height - args.top - args.bottom - args.buffer * 2
      }

      if (args.orientation == 'horizontal') {
        length = 'width'
        width = 'height'
        length_type = args.xAxis_type
        width_type = args.yAxis_type
        length_coord = 'x'
        width_coord = 'y'
        length_scalefn = length_type == 'categorical' ? args.scaleFunctions.xoutf : args.scaleFunctions.xf
        width_scalefn = width_type == 'categorical' ? args.scaleFunctions.youtf : args.scaleFunctions.yf
        length_scale = args.scales.X
        width_scale = args.scales.Y
        length_accessor = args.xAccessor
        width_accessor = args.yAccessor

        length_coord_map = d => {
          let l
          l = length_scale(0)
          return l
        }

        length_map = d => args.width - args.left - args.right - args.buffer * 2
      }

      // rollover text
      let rollover_x, rollover_anchor
      if (args.rollover_align === 'right') {
        rollover_x = args.width - args.right
        rollover_anchor = 'end'
      } else if (args.rollover_align === 'left') {
        rollover_x = args.left
        rollover_anchor = 'start'
      } else {
        rollover_x = (args.width - args.left - args.right) / 2 + args.left
        rollover_anchor = 'middle'
      }

      svg.append('text')
        .attr('class', 'mg-active-datapoint')
        .attr('xml:space', 'preserve')
        .attr('x', rollover_x)
        .attr('y', args.top * 0.75)
        .attr('dy', '.35em')
        .attr('text-anchor', rollover_anchor)

      g = svg.append('g')
        .attr('class', 'mg-rollover-rect')

      // draw rollover bars
      const bars = g.selectAll('.mg-bar-rollover')
        .data(args.data[0]).enter()
        .append('rect')
        .attr('class', 'mg-bar-rollover')

      bars.attr('opacity', 0)
        .attr(length_coord, length_coord_map)
        .attr(width_coord, d => {
          let w
          if (width_type == 'categorical') {
            w = width_scalefn(d)
          } else {
            w = width_scale(0)
            if (d[width_accessor] < 0) {
              w = width_scalefn(d)
            }
          }
          w = w - args.bar_thickness / 2
          return w
        })

      bars.attr(length, length_map)
      bars.attr(width, d => args.bar_thickness)

      bars
        .on('mouseover', this.rolloverOn(args))
        .on('mouseout', this.rolloverOff(args))
        .on('mousemove', this.rolloverMove(args))

      return this
    }

    this.rolloverOn = (args) => {
      const svg = getSvgChildOf(args.target)
      const label_accessor = this.is_vertical ? args.xAccessor : args.yAccessor
      const data_accessor = this.is_vertical ? args.yAccessor : args.xAccessor
      const label_units = this.is_vertical ? args.yaxUnits : args.xaxUnits

      return (d, i) => {
        const fmt = MG.time_format(args.utcTime, '%b %e, %Y')
        const num = formatRolloverNumber(args)

        // highlight active bar
        const bar = svg.selectAll('g.mg-barplot .mg-bar')
          .filter((d, j) => j === i).classed('active', true)

        if (args.scales.hasOwnProperty('COLOR')) {
          bar.attr('fill', d3.rgb(args.scaleFunctions.colorFunction(d)).darker())
        } else {
          bar.classed('default-active', true)
        }

        // update rollover text
        if (args.show_rollover_text) {
          const mouseover = mg_mouseover_text(args, { svg })
          let row = mouseover.mouseover_row()

          if (args.yGroupAccessor) row.text(`${d[args.yGroupAccessor]}   `).bold()

          row.text(formatXMouseover(args, d))
          row.text(`${args.yAccessor}: ${d[args.yAccessor]}`)
          if (args.predictorAccessor || args.baselineAccessor) {
            row = mouseover.mouseover_row()

            if (args.predictorAccessor) row.text(formatDataForMouseover(args, d, null, args.predictorAccessor, false))
            if (args.baselineAccessor) row.text(formatDataForMouseover(args, d, null, args.baselineAccessor, false))
          }
        }
        if (args.mouseover) {
          args.mouseover(d, i)
        }
      }
    }

    this.rolloverOff = (args) => {
      const svg = getSvgChildOf(args.target)

      return (d, i) => {
        // reset active bar
        const bar = svg.selectAll('g.mg-barplot .mg-bar.active').classed('active', false)

        if (args.scales.hasOwnProperty('COLOR')) {
          bar.attr('fill', args.scaleFunctions.colorFunction(d))
        } else {
          bar.classed('default-active', false)
        }

        // reset active data point text
        svg.select('.mg-active-datapoint')
          .text('')

        mg_clear_mouseover_container(svg)

        if (args.mouseout) {
          args.mouseout(d, i)
        }
      }
    }

    this.rolloverMove = (args) => (d, i) => {
      if (args.mousemove) {
        args.mousemove(d, i)
      }
    }

    this.windowListeners = () => {
      windowListeners(this.args)
      return this
    }

    this.init(args)
  }

  const options = {
    buffer: [16, 'number'],
    yAccessor: ['factor', 'string'],
    xAccessor: ['value', 'string'],
    reference_accessor: [null, 'string'],
    comparison_accessor: [null, 'string'],
    secondaryLabel_accessor: [null, 'string'],
    colorAccessor: [null, 'string'],
    colorType: ['category', ['number', 'category']],
    colorDomain: [null, 'number[]'],
    reference_thickness: [1, 'number'],
    comparison_width: [3, 'number'],
    comparison_thickness: [null, 'number'],
    legend: [false, 'boolean'],
    legend_target: [null, 'string'],
    mouseover_align: ['right', ['right', 'left']],
    baselineAccessor: [null, 'string'],
    predictorAccessor: [null, 'string'],
    predictor_proportion: [5, 'number'],
    showBarZero: [true, 'boolean'],
    binned: [true, 'boolean'],
    truncateXLabels: [true, 'boolean'],
    truncate_yLabels: [true, 'boolean']
  }

  MG.register('bar', barChart, options)
}
