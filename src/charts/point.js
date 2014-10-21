charts.point = function(args) {
    this.args = args;

    this.init = function(args) {
        raw_data_transformation(args);
        process_point(args);
        init(args);
        x_axis(args);
        y_axis(args);
        return this;
    }

    this.markers = function() {
        markers(args);
        if (args.least_squares){
            add_ls(args);
        }
        // if (args.lowess){
        //     add_lowess(args);
        // }
        return this
    }

    this.mainPlot = function() {
        var svg = d3.select(args.target + ' svg');
        var g;

        // plot the points, pretty straight-forward
        g = svg.append('g')
            .classed('points', true);

        var pts = g.selectAll('circle')
            .data(args.data[0])
            .enter().append('svg:circle')
                .attr('cx', args.scalefns.xf)
                .attr('cy', args.scalefns.yf);

        if (args.color_accessor!=null){
            pts.attr('fill',   args.scalefns.color);
            pts.attr('stroke', args.scalefns.color);
        } else {
            pts.attr('fill',   '#0000ff');
            pts.attr('stroke', '#0000ff');
        }
        if (args.size_accessor!=null){
            pts.attr('r', args.scalefns.size);
        } else {
            pts.attr('r', 2);
        }

        if (args.x_rug){
            //var data = args.data[0].map(function(d){return d[args.x_accessor]});
            g.selectAll('line.x_rug').data(args.data[0]).enter().append('svg:line')
                .attr('x1', args.scalefns.xf)
                .attr('x2', args.scalefns.xf)
                .attr('y1', args.height-args.top+args.buffer)
                .attr('y2', args.height-args.top)
                .attr('stroke', 'black')
                .attr('opacity', .2);
        }
        if (args.y_rug){
            g.selectAll('line.y_rug').data(args.data[0]).enter().append('svg:line')
                .attr('x1', args.left+1)
                .attr('x2', args.left+args.buffer)
                .attr('y1', args.scalefns.yf)
                .attr('y2', args.scalefns.yf)
                .attr('stroke', 'black')
                .attr('opacity', .2);
        }

        return this;
    }

    this.rollover = function() {
        var svg = d3.select(args.target + ' svg');

        var clips = svg.append('g')
                .attr('id', 'point-clips');

        var paths = svg.append('g')
            .attr('id', 'point-paths');

        //remove rollover text if it already exists
        if($(args.target + ' svg .active_datapoint').length > 0) {
            $(args.target + ' svg .active_datapoint').remove();
        }
        
        //add rollover text
        svg.append('text')
            .attr('class', 'active_datapoint')
            .attr('xml:space', 'preserve')
            .attr('x', args.width - args.right)
            .attr('y', args.top / 2)
            .attr('text-anchor', 'end');
        
        clips.selectAll('clipPath')
            .data(args.data[0])
                .enter().append('clipPath')
                    .attr('id', function(d, i) { return 'clip-'+i;})
                    .append('circle')
                        .attr('cx', args.scalefns.xf)
                        .attr('cy', args.scalefns.yf)
                        .attr('r', 20);

        var voronoi = d3.geom.voronoi()
            .x(args.scalefns.xf)
            .y(args.scalefns.yf);

        paths.selectAll('path')
            .data(voronoi(args.data[0]))
            .enter().append('path')
                .attr('d', function(d) { 
                    return 'M' + d.join(',') + 'Z';
                })
                .attr('id', function(d,i) { 
                    return 'path-' + i;
                })
                .attr('clip-path', function(d,i) {
                    return 'url(#clip-'+i+')';
                })
                .style('fill-opacity', 0)
                .on('mouseover', this.rolloverOn(args))
                .on('mouseout', this.rolloverOff(args));

        return this;
    }

    this.rolloverOn = function(args) {
        var svg = d3.select(args.target + ' svg');

        return function(d, i){
            svg.selectAll('.points circle')
                .classed('unselected', true);

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

            //highlight active point
            var pts = svg.selectAll('.points circle')
                .filter(function(g,j){return i == j})
                .classed('unselected', false)
                .classed('selected', true);

            if (args.size_accessor){
                pts.attr('r', function(di){return args.scalefns.size(di)+1});
            } else {
                pts.attr('r', 3);
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
        }
    }

    this.rolloverOff = function(args) {
        var svg = d3.select(args.target + ' svg');

        return function(d,i){
            //reset active point
            var pts = svg.selectAll('.points circle')
                .classed('unselected', false)
                .classed('selected', false);

            if (args.size_accessor){
                pts.attr('r', args.scalefns.size);
            } else {
                pts.attr('r', 2);
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
