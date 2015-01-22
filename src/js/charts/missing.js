charts.missing = function(args) {
    'use strict';
    this.args = args;

    this.init = function(args) {
        chart_title(args);

        // create svg if one doesn't exist
        d3.select(args.target).selectAll('svg').data([args])
          .enter().append('svg')
            .attr('width', args.width)
            .attr('height', args.height);

        var svg = d3.select(args.target).select('svg');

        // has the width or height changed?
        if (args.width !== Number(svg.attr('width'))) {
            svg.attr('width', args.width);
        }

        if (args.height !== Number(svg.attr('height'))) {
            svg.attr('height', args.height);
        }

        // delete child elements
        d3.select(args.target).selectAll('svg *').remove();

        // add missing class
        svg.classed('mg-missing', true);

        // do we need to clear the legend?
        if (args.legend_target) {
            $(args.legend_target).html('');
        }

        //are we adding a background placeholder
        if (args.show_missing_background) {
            var data = [];
            for (var x = 1; x <= 50; x++) {
                data.push({'x': x, 'y': Math.random() - (x * 0.03)});
            }

            args.scales.X = d3.scale.linear()
                .domain([0, data.length])
                .range([args.left + args.buffer, args.width - args.right - args.buffer]);

            args.scales.Y = d3.scale.linear()
                .domain([-2, 2])
                .range([args.height - args.bottom - args.buffer*2, args.top]);

            args.scalefns.xf = function(di) { return args.scales.X(di.x); };
            args.scalefns.yf = function(di) { return args.scales.Y(di.y); };

            var line = d3.svg.line()
                .x(args.scalefns.xf)
                .y(args.scalefns.yf)
                .interpolate(args.interpolate);

            var area = d3.svg.area()
                .x(args.scalefns.xf)
                .y0(args.scales.Y.range()[0])
                .y1(args.scalefns.yf)
                .interpolate(args.interpolate);

            var g = svg.append('g')
                .attr('class', 'mg-missing-pane');

            g.append('svg:rect')
                .classed('mg-missing-background', true)
                .attr('x', args.buffer)
                .attr('y', args.buffer)
                .attr('width', args.width-args.buffer*2)
                .attr('height', args.height-args.buffer*2)
                .attr('rx',15)
                .attr('ry', 15);

            g.append('path')
                .attr('class', 'mg-main-line mg-line1-color')
                .attr('d', line(data));

            g.append('path')
                .attr('class', 'mg-main-area mg-area1-color')
                .attr('d', area(data));
        }

        // add missing text
        svg.selectAll('.mg-missing-text').data([args.missing_text])
          .enter().append('text')
            .attr('class', 'mg-missing-text')
            .attr('x', args.width / 2)
            .attr('y', args.height / 2)
            .attr('dy', '.50em')
            .attr('text-anchor', 'middle')
            .text(args.missing_text);

        return this;
    };

    this.init(args);
    return this;
};
