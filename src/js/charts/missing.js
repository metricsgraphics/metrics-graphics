charts.missing = function(args) {
    'use strict';
    this.args = args;

    this.init = function(args) {
        var svg_width, 
            svg_height;

        svg_width = args.width;
        svg_height = args.height;

        if (args.full_width) {
            // get parent element
            svg_width = get_width(args.target);
        }

        if (args.full_height) {
            svg_height = get_height(args.target);
        }

        chart_title(args);
        // create svg if one doesn't exist
        d3.select(args.target).selectAll('svg').data([args])
          .enter().append('svg')
            .attr('width', svg_width)
            .attr('height', svg_height);

        var svg = mg_get_svg_child_of(args.target);
        
        // has the width or height changed?
        if (svg_width !== Number(svg.attr('width'))) {
            svg.attr('width', svg_width);
        }

        if (svg_height !== Number(svg.attr('height'))) {
            svg.attr('height', svg_height);
        }

        // @todo need to reconsider how we handle automatic scaling
        svg.attr('viewBox', '0 0 ' + svg_width + ' ' + svg_height);

        // delete child elements
        d3.select(args.target).selectAll('svg *').remove();

        // add missing class
        svg.classed('mg-missing', true);

        // do we need to clear the legend?
        if (args.legend_target) {
            d3.select(args.legend_target).html('');
        }

        //are we adding a background placeholder
        if (args.show_missing_background) {
            var data = [];
            for (var x = 1; x <= 50; x++) {
                data.push({'x': x, 'y': Math.random() - (x * 0.03)});
            }

            args.scales.X = d3.scale.linear()
                .domain([0, data.length])
                .range([args.left + args.buffer, svg_width - args.right - args.buffer]);

            args.scales.Y = d3.scale.linear()
                .domain([-2, 2])
                .range([svg_height - args.bottom - args.buffer*2, args.top]);

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
                .attr('width', svg_width-args.buffer*2)
                .attr('height', svg_height-args.buffer*2)
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
            .attr('x', svg_width / 2)
            .attr('y', svg_height / 2)
            .attr('dy', '.50em')
            .attr('text-anchor', 'middle')
            .text(args.missing_text);

        return this;
    };

    this.init(args);
    return this;
};
