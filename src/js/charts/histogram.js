{
  function histogram(args) {
    this.init = (args) => {
      this.args = args;

      raw_data_transformation(args);
      process_histogram(args);
      init(args);

      new MG.scale_factory(args)
        .namespace('x')
        .numericalDomainFromData()
        .numericalRange('bottom');

      const baselines = (args.baselines || []).map(d => d[args.y_accessor]);

      new MG.scale_factory(args)
        .namespace('y')
        .zeroBottom(true)
        .inflateDomain(true)
        .numericalDomainFromData(baselines)
        .numericalRange('left');

      x_axis(args);
      y_axis(args);

      this.mainPlot();
      this.markers();
      this.rollover();
      this.windowListeners();

      return this;
    };

    this.mainPlot = () => {
      const svg = mg_get_svg_child_of(args.target);

      //remove the old histogram, add new one
      svg.selectAll('.mg-histogram').remove();

      const g = svg.append('g')
        .attr('class', 'mg-histogram');

      const bar = g.selectAll('.mg-bar')
        .data(args.data[0])
        .enter().append('g')
        .attr('class', 'mg-bar')
        .attr('transform', d => `translate(${args.scales.X(d[args.x_accessor]).toFixed(2)},${args.scales.Y(d[args.y_accessor]).toFixed(2)})`);

      //draw bars
      bar.append('rect')
        .attr('x', 1)
        .attr('width', (d, i) => {
          if (args.data[0].length === 1) {
            return (args.scalefns.xf(args.data[0][0]) - args.bar_margin).toFixed(0);
          } else if (i !== args.data[0].length - 1) {
            return (args.scalefns.xf(args.data[0][i + 1]) - args.scalefns.xf(d)).toFixed(0);
          } else {
            return (args.scalefns.xf(args.data[0][1]) - args.scalefns.xf(args.data[0][0])).toFixed(0);
          }
        })
        .attr('height', d => {
          if (d[args.y_accessor] === 0) {
            return 0;
          }

          return (args.height - args.bottom - args.buffer - args.scales.Y(d[args.y_accessor])).toFixed(2);
        });

      return this;
    };

    this.markers = () => {
      markers(args);
      return this;
    };

    this.rollover = () => {
      const svg = mg_get_svg_child_of(args.target);

      if (svg.selectAll('.mg-active-datapoint-container').nodes().length === 0) {
        mg_add_g(svg, 'mg-active-datapoint-container');
      }

      //remove the old rollovers if they already exist
      svg.selectAll('.mg-rollover-rect').remove();
      svg.selectAll('.mg-active-datapoint').remove();

      const g = svg.append('g')
        .attr('class', 'mg-rollover-rect');

      //draw rollover bars
      const bar = g.selectAll('.mg-bar')
        .data(args.data[0])
        .enter().append('g')
        .attr('class', (d, i) => {
          if (args.linked) {
            return `mg-rollover-rects roll_${i}`;
          } else {
            return 'mg-rollover-rects';
          }
        })
        .attr('transform', d => `translate(${args.scales.X(d[args.x_accessor])},${0})`);

      bar.append('rect')
        .attr('x', 1)
        .attr('y', args.buffer + (args.title ? args.title_y_position : 0))
        .attr('width', (d, i) => {
          //if data set is of length 1
          if (args.data[0].length === 1) {
            return (args.scalefns.xf(args.data[0][0]) - args.bar_margin).toFixed(0);
          } else if (i !== args.data[0].length - 1) {
            return (args.scalefns.xf(args.data[0][i + 1]) - args.scalefns.xf(d)).toFixed(0);
          } else {
            return (args.scalefns.xf(args.data[0][1]) - args.scalefns.xf(args.data[0][0])).toFixed(0);
          }
        })
        .attr('height', d => args.height)
        .attr('opacity', 0)
        .on('mouseover', this.rolloverOn(args))
        .on('mouseout', this.rolloverOff(args))
        .on('mousemove', this.rolloverMove(args));

      return this;
    };

    this.rolloverOn = (args) => {
      const svg = mg_get_svg_child_of(args.target);

      return (d, i) => {
        svg.selectAll('text')
          .filter((g, j) => d === g)
          .attr('opacity', 0.3);

        const fmt = args.processed.xax_format || MG.time_format(args.utc_time, '%b %e, %Y');
        const num = format_rollover_number(args);

        svg.selectAll('.mg-bar rect')
          .filter((d, j) => j === i)
          .classed('active', true);

        //trigger mouseover on all matching bars
        if (args.linked && !MG.globals.link) {
          MG.globals.link = true;

          //trigger mouseover on matching bars in .linked charts
          d3.selectAll(`.mg-rollover-rects.roll_${i} rect`)
            .each(function(d) { //use existing i
              d3.select(this).on('mouseover')(d, i);
            });
        }

        //update rollover text
        if (args.show_rollover_text) {
          const mo = mg_mouseover_text(args, { svg });
          const row = mo.mouseover_row();
          row.text('\u259F  ').elem
            .classed('hist-symbol', true);

          row.text(mg_format_x_mouseover(args, d)); // x
          row.text(mg_format_y_mouseover(args, d, args.time_series === false));
        }

        if (args.mouseover) {
          mg_setup_mouseover_container(svg, args);
          args.mouseover(d, i);
        }
      };
    };

    this.rolloverOff = (args) => {
      const svg = mg_get_svg_child_of(args.target);

      return (d, i) => {
        if (args.linked && MG.globals.link) {
          MG.globals.link = false;

          //trigger mouseout on matching bars in .linked charts
          d3.selectAll(`.mg-rollover-rects.roll_${i} rect`)
            .each(function(d) { //use existing i
              d3.select(this).on('mouseout')(d, i);
            });
        }

        //reset active bar
        svg.selectAll('.mg-bar rect')
          .classed('active', false);

        //reset active data point text
        mg_clear_mouseover_container(svg);

        if (args.mouseout) {
          args.mouseout(d, i);
        }
      };
    };

    this.rolloverMove = (args) => (d, i) => {
      if (args.mousemove) {
        args.mousemove(d, i);
      }
    };

    this.windowListeners = () => {
      mg_window_listeners(this.args);
      return this;
    };

    this.init(args);
  }

  const defaults = {
    binned: false,
    bins: null,
    processed_x_accessor: 'x',
    processed_y_accessor: 'y',
    processed_dx_accessor: 'dx',
    bar_margin: 1
  };

  MG.register('histogram', histogram, defaults);
}
