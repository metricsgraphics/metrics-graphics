function point_mouseover(args, svg, d) {
  const mouseover = mg_mouseover_text(args, { svg });
  const row = mouseover.mouseover_row();

  if (args.color_accessor !== null && args.color_type === 'category') {
    const label = d[args.color_accessor];
    row.text(`${label}  `).bold().elem().attr('fill', args.scalefns.colorf(d));
  }

  mg_color_point_mouseover(args, row.text('\u25CF   ').elem(), d); // point shape

  row.text(mg_format_x_mouseover(args, d)); // x
  row.text(mg_format_y_mouseover(args, d, args.time_series === false));
}

function mg_color_point_mouseover({color_accessor, scalefns}, elem, d) {
  if (color_accessor !== null) {
    elem.attr('fill', scalefns.colorf(d));
    elem.attr('stroke', scalefns.colorf(d));
  } else {
    elem.classed('mg-points-mono', true);
  }
}


{
  function mg_filter_out_plot_bounds(data, args) {
    // max_x, min_x, max_y, min_y;
    const x = args.x_accessor;
    const y = args.y_accessor;
    const new_data = data.filter(d => (args.min_x === null || d[x] >= args.min_x) &&
      (args.max_x === null || d[x] <= args.max_x) &&
      (args.min_y === null || d[y] >= args.min_y) &&
      (args.max_y === null || d[y] <= args.max_y));
    return new_data;
  }

  function pointChart(args) {
    this.init = function(args) {
      this.args = args;

      // infer y_axis and x_axis type;
      args.x_axis_type = mg_infer_type(args, 'x');
      args.y_axis_type = mg_infer_type(args, 'y');

      raw_data_transformation(args);

      process_point(args);
      init(args);

      let xMaker, yMaker;

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
          args.scales.XGROUP = () => mg_get_plot_left(args);
          args.scalefns.xgroupf = () => mg_get_plot_left(args);
        }

        args.scalefns.xoutf = d => args.scalefns.xf(d) + args.scalefns.xgroupf(d);
      } else {
        xMaker = MG.scale_factory(args)
          .namespace('x')
          .inflateDomain(true)
          .zeroBottom(args.y_axis_type === 'categorical')
          .numericalDomainFromData((args.baselines || []).map(d => d[args.x_accessor]))
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
          args.scales.YGROUP = () => mg_get_plot_top(args);
          args.scalefns.ygroupf = () => mg_get_plot_top(args);

        }
        args.scalefns.youtf = d => args.scalefns.yf(d) + args.scalefns.ygroupf(d);

      } else {
        const baselines = (args.baselines || []).map(d => d[args.y_accessor]);
        yMaker = MG.scale_factory(args)
          .namespace('y')
          .inflateDomain(true)
          .zeroBottom(args.x_axis_type === 'categorical')
          .numericalDomainFromData(baselines)
          .numericalRange('left');

        args.scalefns.youtf = d => args.scalefns.yf(d);
      }

      /////// COLOR accessor
      if (args.color_accessor !== null) {
        const colorScale = MG.scale_factory(args).namespace('color');
        if (args.color_type === 'number') {
          // do the color scale.
          // etiher get color range, or what.
          colorScale
            .numericalDomainFromData(mg_get_color_domain(args))
            .numericalRange(mg_get_color_range(args))
            .clamp(true);
        } else {
          if (args.color_domain) {
            colorScale
              .categoricalDomain(args.color_domain)
              .categoricalRange(args.color_range);
          } else {
            colorScale
              .categoricalDomainFromData()
              .categoricalColorRange();
          }
        }
      }

      if (args.size_accessor) {
        new MG.scale_factory(args).namespace('size')
          .numericalDomainFromData()
          .numericalRange(mg_get_size_range(args))
          .clamp(true);
      }

      new MG.axis_factory(args)
        .namespace('x')
        .type(args.x_axis_type)
        .zeroLine(args.y_axis_type === 'categorical')
        .position(args.x_axis_position)
        .rug(x_rug(args))
        .label(mg_add_x_label)
        .draw();

      new MG.axis_factory(args)
        .namespace('y')
        .type(args.y_axis_type)
        .zeroLine(args.x_axis_type === 'categorical')
        .position(args.y_axis_position)
        .rug(y_rug(args))
        .label(mg_add_y_label)
        .draw();

      this.mainPlot();
      this.markers();
      this.rollover();
      this.windowListeners();

      return this;
    };

    this.markers = function() {
      markers(args);
      if (args.least_squares) {
        add_ls(args);
      }

      return this;
    };

    this.mainPlot = function() {
      const svg = mg_get_svg_child_of(args.target);

      const data = mg_filter_out_plot_bounds(args.data[0], args);
      //remove the old points, add new one
      svg.selectAll('.mg-points').remove();

      const g = svg.append('g')
        .classed('mg-points', true);

      const pts = g.selectAll('circle')
        .data(data)
        .enter().append('circle')
        .attr('class', (d, i) => `path-${i}`)
        .attr('cx', args.scalefns.xoutf)
        .attr('cy', d => args.scalefns.youtf(d));

      //are we coloring our points, or just using the default color?
      if (args.color_accessor !== null) {
        pts.attr('fill', args.scalefns.colorf);
        pts.attr('stroke', args.scalefns.colorf);
      } else {
        pts.classed('mg-points-mono', true);
      }

      if (args.size_accessor !== null) {
        pts.attr('r', args.scalefns.sizef);
      } else {
        pts.attr('r', args.point_size);
      }

      return this;
    };

    this.rollover = function() {
      const svg = mg_get_svg_child_of(args.target);

      if (svg.selectAll('.mg-active-datapoint-container').nodes().length === 0) {
        mg_add_g(svg, 'mg-active-datapoint-container');
      }

      //remove the old rollovers if they already exist
      svg.selectAll('.mg-voronoi').remove();

      //add rollover paths
      const voronoi = d3.voronoi()
        .x(args.scalefns.xoutf)
        .y(args.scalefns.youtf)
        .extent([
          [args.buffer, args.buffer + args.title_y_position],
          [args.width - args.buffer, args.height - args.buffer]
        ]);

      const paths = svg.append('g')
        .attr('class', 'mg-voronoi');

      paths.selectAll('path')
        .data(voronoi.polygons(mg_filter_out_plot_bounds(args.data[0], args)))
        .enter().append('path')
        .attr('d', d => d == null ? null : `M${d.join(',')}Z`)
        .attr('class', (d, i) => `path-${i}`)
        .style('fill-opacity', 0)
        .on('mouseover', this.rolloverOn(args))
        .on('mouseout', this.rolloverOff(args))
        .on('mousemove', this.rolloverMove(args));

      if (args.data[0].length === 1) {
        point_mouseover(args, svg, args.data[0][0]);
      }

      return this;
    };

    this.rolloverOn = args => {
      const svg = mg_get_svg_child_of(args.target);

      return (d, i) => {
        svg.selectAll('.mg-points circle')
          .classed('selected', false);

        //highlight active point
        const pts = svg.selectAll(`.mg-points circle.path-${i}`)
          .classed('selected', true);

        if (args.size_accessor) {
          pts.attr('r', di => args.scalefns.sizef(di) + args.active_point_size_increase);
        } else {
          pts.attr('r', args.point_size + args.active_point_size_increase);
        }

        //trigger mouseover on all points for this class name in .linked charts
        if (args.linked && !MG.globals.link) {
          MG.globals.link = true;

          //trigger mouseover on matching point in .linked charts
          d3.selectAll(`.mg-voronoi .path-${i}`)
            .each(() => {
              d3.select(this).on('mouseover')(d, i);
            });
        }

        if (args.show_rollover_text) {
          point_mouseover(args, svg, d.data);
        }

        if (args.mouseover) {
          args.mouseover(d, i);
        }
      };
    };

    this.rolloverOff = args => {
      const svg = mg_get_svg_child_of(args.target);

      return (d, i) => {
        if (args.linked && MG.globals.link) {
          MG.globals.link = false;

          d3.selectAll(`.mg-voronoi .path-${i}`)
            .each(() => {
              d3.select(this).on('mouseout')(d, i);
            });
        }

        //reset active point
        const pts = svg.selectAll('.mg-points circle')
          .classed('unselected', false)
          .classed('selected', false);

        if (args.size_accessor) {
          pts.attr('r', args.scalefns.sizef);
        } else {
          pts.attr('r', args.point_size);
        }

        //reset active data point text
        if (args.data[0].length > 1) mg_clear_mouseover_container(svg);

        if (args.mouseout) {
          args.mouseout(d, i);
        }
      };
    };

    this.rolloverMove = args => (d, i) => {
      if (args.mousemove) {
        args.mousemove(d, i);
      }
    };

    this.update = function(args) {
      return this;
    };

    this.windowListeners = function() {
      mg_window_listeners(this.args);
      return this;
    };

    this.init(args);
  }

  const defaults = {
    y_padding_percentage: 0.05, // for categorical scales
    y_outer_padding_percentage: .2, // for categorical scales
    ygroup_padding_percentage: 0, // for categorical scales
    ygroup_outer_padding_percentage: 0, // for categorical scales
    x_padding_percentage: 0.05, // for categorical scales
    x_outer_padding_percentage: .2, // for categorical scales
    xgroup_padding_percentage: 0, // for categorical scales
    xgroup_outer_padding_percentage: 0, // for categorical scales
    y_categorical_show_guides: true,
    x_categorical_show_guides: true,
    buffer: 16,
    ls: false,
    lowess: false,
    point_size: 2.5,
    label_accessor: null,
    size_accessor: null,
    color_accessor: null,
    size_range: null, // when we set a size_accessor option, this array determines the size range, e.g. [1,5]
    color_range: null, // e.g. ['blue', 'red'] to color different groups of points
    size_domain: null,
    color_domain: null,
    active_point_size_increase: 1,
    color_type: 'number' // can be either 'number' - the color scale is quantitative - or 'category' - the color scale is qualitative.
  };

  MG.register('point', pointChart, defaults);
}