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

        g.selectAll('circle')
            .data(args.data[0])
            .enter().append('svg:circle')
                .attr('cx', args.scalefns.xf)
                .attr('cy', args.scalefns.yf)
                .attr('r', 2);

        return this;
    }

    this.rollover = function() {
        var svg = d3.select(args.target + ' svg');

        var clips = svg.append('g')
                .attr('id', 'point-clips');

        var paths = svg.append('g')
            .attr('id', 'point-paths');

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

        return function(d,i){
            svg.selectAll('.points circle')
                .classed('unselected', true);

            svg.selectAll('.points circle')
                .filter(function(g,j){return i == j})
                .classed('unselected', false)
                .classed('selected', true)
                .attr('r', 3);
        }
    }

    this.rolloverOff = function(args) {
        var svg = d3.select(args.target + ' svg');

        return function(d,i){
            svg.selectAll('.points circle')
                .classed('unselected', false)
                .classed('selected', false)
                .attr('r', 2);
        }
    }

    this.update = function(args) {
        return this;
    }

    this.init(args);

    return this;
}
