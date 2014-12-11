charts.point = function(args) {
    'use strict';
    this.args = args;

    this.init = function(args) {
        raw_data_transformation(args);
        process_point(args);
        init(args);
        x_axis(args);
        y_axis(args);
        this.$svg = document.querySelector(args.target + ' svg')
        this.svg = d3.select(this.$svg)
        return this;
    }

    this.markers = function() {
        markers(args);
        if (args.least_squares) {
            add_ls(args);
        }

        return this
    }

    this.mainPlot = function() {
        var g;

        //remove the old points, add new one
        var oldPoints = this.$svg.querySelector('.points');

        if(oldPoints)
          oldPoints.parentNode.removeChild(oldPoints);
        
        // plot the points, pretty straight-forward
        g = this.svg.append('g')
            .classed('points', true);

        var pts = g.selectAll('circle')
            .data(args.data[0])
            .enter().append('svg:circle')
                .attr('class', function(d, i) { return 'path-' + i; })
                .attr('cx', args.scalefns.xf)
                .attr('cy', args.scalefns.yf);

        //are we coloring our points, or just using the default color?
        if (args.color_accessor!=null) {
            pts.attr('fill',   args.scalefns.color);
            pts.attr('stroke', args.scalefns.color);
        }
        else {
            pts.classed('points-mono', true);
        }

        if (args.size_accessor != null) {
            pts.attr('r', args.scalefns.size);
        }
        else {
            pts.attr('r', args.point_size);
        }

        return this;
    }

    this.rollover = function() {

        [
          //remove the old rollovers if they already exist
          this.$svg.querySelector('.voronoi'),
          //remove the old rollover text and circle if they already exist
          this.$svg.querySelector('.active_datapoint')
        ].forEach(function(e, i) {
        
          if(!e)
            return;

          e.parentNode.removeChild(e);
        })

        //add rollover text
        this.svg.append('text')
            .attr('class', 'active_datapoint')
            .attr('xml:space', 'preserve')
            .attr('x', args.width - args.right)
            .attr('y', args.top / 2)
            .attr('text-anchor', 'end');

        //add rollover paths
        var voronoi = d3.geom.voronoi()
            .x(args.scalefns.xf)
            .y(args.scalefns.yf)
            .clipExtent([[args.buffer, args.buffer], [args.width - args.buffer, args.height - args.buffer]]);

        var paths = this.svg.append('g')
            .attr('class', 'voronoi');

        paths.selectAll('path')
            .data(voronoi(args.data[0]))
            .enter().append('path')
                .attr('d', function(d) {
                    if(d == undefined) return; 
                    return 'M' + d.join(',') + 'Z';
                })
                .attr('class', function(d,i) { 
                    return 'path-' + i;
                })
                .style('fill-opacity', 0)
                .on('mouseover', this.rolloverOn(args))
                .on('mouseout', this.rolloverOff(args));

        return this;
    }

    this.rolloverOn = function(args) {
        var svg = this.svg;

        return function(d, i) {
            svg.selectAll('.points circle')
                .classed('selected', false);

            //highlight active point
            var pts = svg.selectAll('.points circle.path-' + i)
                .classed('selected', true);

            if (args.size_accessor) {
                pts.attr('r', function(di) {
                    return args.scalefns.size(di) + 1
                });
            } else {
                pts.attr('r', args.point_size);
            }

            //trigger mouseover on all points for this class name in .linked charts
            if(args.linked && !globals.link) {
                globals.link = true;

                //trigger mouseover on matching point in .linked charts
                d3.selectAll('.voronoi .path-' + i)
                    .each(function() {
                        d3.select(this).on('mouseover')(d,i);
                })
            }

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
                svg.select('.active_datapoint')
                    .text(function() {
                        if(args.time_series) {
                            var dd = new Date(+d['point'][args.x_accessor]);
                            dd.setDate(dd.getDate());
                            
                            return fmt(dd) + '  ' + args.yax_units 
                                + num(d['point'][args.y_accessor]);
                        }
                        else {
                            return args.x_accessor + ': ' + num(d['point'][args.x_accessor]) 
                                + ', ' + args.y_accessor + ': ' + args.yax_units 
                                + num(d['point'][args.y_accessor]);
                        }
                    });                
            }

            if(args.rollover_callback) {
                args.rollover_callback(d, i);
            }
        }
    }

    this.rolloverOff = function(args) {
        var svg = this.svg;

        return function(d,i) {
            if(args.linked && globals.link) {
                globals.link = false;

                d3.selectAll('.voronoi .path-' + i)
                    .each(function() {
                        d3.select(this).on('mouseout')(d,i);
                })
            }

            //reset active point
            var pts = svg.selectAll('.points circle')
                .classed('unselected', false)
                .classed('selected', false);

            if (args.size_accessor) {
                pts.attr('r', args.scalefns.size);
            }
            else {
                pts.attr('r', args.point_size);
            }

            //reset active data point text
            svg.select('.active_datapoint')
                .text('');
        }
    }

    this.update = function(args) {
        return this;
    }

    this.init(args);

    return this;
}
