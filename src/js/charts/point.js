
(function() {
  'use strict';

  function pointChart(args) {
    this.init = function(args) {
      this.args = args;

      raw_data_transformation(args);
      process_point(args);
      init(args);
      x_axis(args);
      y_axis(args);

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
      var svg = mg_get_svg_child_of(args.target);
      var g;

      //remove the old points, add new one
      svg.selectAll('.mg-points').remove();

      // plot the points, pretty straight-forward
      g = svg.append('g')
        .classed('mg-points', true);

      var pts = g.selectAll('circle')
        .data(args.data[0])
        .enter().append('svg:circle')
          .attr('class', function(d, i) { return 'path-' + i; })
          .attr('cx', args.scalefns.xf)
          .attr('cy', args.scalefns.yf);

      //are we coloring our points, or just using the default color?
      if (args.color_accessor !== null) {
        pts.attr('fill',   args.scalefns.color);
        pts.attr('stroke', args.scalefns.color);
      } else {
        pts.classed('mg-points-mono', true);
      }

      if (args.size_accessor !== null) {
        pts.attr('r', args.scalefns.size);
      } else {
        pts.attr('r', args.point_size);
      }

      return this;
    };

    this.rollover = function() {
      var svg = mg_get_svg_child_of(args.target);

      //remove the old rollovers if they already exist
      svg.selectAll('.mg-voronoi').remove();

      //remove the old rollover text and circle if they already exist
      svg.selectAll('.mg-active-datapoint').remove();

      //add rollover text
      svg.append('text')
        .attr('class', 'mg-active-datapoint')
        .attr('xml:space', 'preserve')
        .attr('x', args.width - args.right)
        .attr('y', args.top * 0.75)
        .attr('text-anchor', 'end');

      //add rollover paths
      var voronoi = d3.geom.voronoi()
        .x(args.scalefns.xf)
        .y(args.scalefns.yf)
        .clipExtent([[args.buffer, args.buffer + args.title_y_position], [args.width - args.buffer, args.height - args.buffer]]);

      var paths = svg.append('g')
        .attr('class', 'mg-voronoi');

      paths.selectAll('path')
        .data(voronoi(args.data[0]))
        .enter().append('path')
          .attr('d', function(d) {
            if (d === undefined) {
              return;
            }

            return 'M' + d.join(',') + 'Z';
          })
          .attr('class', function(d,i) {
            return 'path-' + i;
          })
          .style('fill-opacity', 0)
          .on('mouseover', this.rolloverOn(args))
          .on('mouseout', this.rolloverOff(args))
          .on('mousemove', this.rolloverMove(args));

      return this;
    };

    this.rolloverOn = function(args) {
      var svg = mg_get_svg_child_of(args.target);

      return function(d, i) {
        svg.selectAll('.mg-points circle')
          .classed('selected', false);

        //highlight active point
        var pts = svg.selectAll('.mg-points circle.path-' + i)
          .classed('selected', true);

        if (args.size_accessor) {
          pts.attr('r', function(di) {
            return args.scalefns.size(di) + args.active_point_size_increase;
          });
        } else {
          pts.attr('r', args.point_size + args.active_point_size_increase);
        }

        //trigger mouseover on all points for this class name in .linked charts
        if (args.linked && !MG.globals.link) {
          MG.globals.link = true;

          //trigger mouseover on matching point in .linked charts
          d3.selectAll('.mg-voronoi .path-' + i)
            .each(function() {
              d3.select(this).on('mouseover')(d,i);
            });
        }

        if (args.show_rollover_text) {
          var fmt = MG.time_format(args.utc_time, '%b %e, %Y');
          mg_update_rollover_text(args,svg,fmt, '\u2022', d.point, i);
        }

        if (args.mouseover) {
          args.mouseover(d, i);
        }
      };
    };

    this.rolloverOff = function(args) {
      var svg = mg_get_svg_child_of(args.target);

      return function(d,i) {
        if (args.linked && MG.globals.link) {
          MG.globals.link = false;

          d3.selectAll('.mg-voronoi .path-' + i)
            .each(function() {
              d3.select(this).on('mouseout')(d,i);
            });
        }

        //reset active point
        var pts = svg.selectAll('.mg-points circle')
          .classed('unselected', false)
          .classed('selected', false);

        if (args.size_accessor) {
          pts.attr('r', args.scalefns.size);
        } else {
          pts.attr('r', args.point_size);
        }

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

    this.update = function(args) {
      return this;
    };

    this.windowListeners = function() {
      mg_window_listeners(this.args);
      return this;
    };

    this.init(args);
  }

  var defaults = {
    buffer: 16,
    ls: false,
    lowess: false,
    point_size: 2.5,
    label_accessor: null,
    size_accessor: null,
    color_accessor: null,
    size_range: null,        // when we set a size_accessor option, this array determines the size range, e.g. [1,5]
    color_range: null,       // e.g. ['blue', 'red'] to color different groups of points
    size_domain: null,
    color_domain: null,
    active_point_size_increase: 1,
    color_type: 'number'       // can be either 'number' - the color scale is quantitative - or 'category' - the color scale is qualitative.
  };

  MG.register('point', pointChart, defaults);
}).call(this);
