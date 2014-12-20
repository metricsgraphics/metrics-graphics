function markers(args) {
    'use strict';
    var svg = d3.select($(args.target).find('svg').get(0));
    var gm;
    var gb;

    if(args.markers) {
        $(args.target).find('svg .mg-markers').remove();

        gm = svg.append('g')
            .attr('class', 'mg-markers');

        gm.selectAll('.mg-markers')
            .data(args.markers.filter(function(d){
                return (args.scales.X(d[args.x_accessor]) > args.buffer + args.left)
                    && (args.scales.X(d[args.x_accessor]) < args.width - args.buffer - args.right);
            }))
            .enter()
            .append('line')
                .attr('x1', function(d) {
                    return args.scales.X(d[args.x_accessor]).toFixed(2);
                })
                .attr('x2', function(d) {
                    return args.scales.X(d[args.x_accessor]).toFixed(2);
                })
                .attr('y1', args.top)
                .attr('y2', function() {
                    return args.height - args.bottom - args.buffer;
                })
                .attr('stroke-dasharray', '3,1');

        gm.selectAll('.mg-markers')
            .data(args.markers.filter(function(d){
                return (args.scales.X(d[args.x_accessor]) > args.buffer + args.left)
                    && (args.scales.X(d[args.x_accessor]) < args.width - args.buffer - args.right);
            }))
            .enter()
            .append('text')
                .attr('x', function(d) {
                    return args.scales.X(d[args.x_accessor])
                })
                .attr('y', args.top - 8)
                .attr('text-anchor', 'middle')
                .text(function(d) {
                    return d['label'];
                });
    }

    if(args.baselines) {
        svg.selectAll('.mg-baselines').remove();
        gb = svg.append('g')
            .attr('class', 'mg-baselines');

        gb.selectAll('.mg-baselines')
            .data(args.baselines)
            .enter().append('line')
                .attr('x1', args.left + args.buffer)
                .attr('x2', args.width-args.right-args.buffer)
                .attr('y1', function(d){
                    return args.scales.Y(d['value']).toFixed(2);
                })
                .attr('y2', function(d){
                    return args.scales.Y(d['value']).toFixed(2);
                });

        gb.selectAll('.mg-baselines')
            .data(args.baselines)
            .enter().append('text')
                .attr('x', args.width-args.right - args.buffer)
                .attr('y', function(d){
                    return args.scales.Y(d['value']).toFixed(2);
                })
                .attr('dy', -3)
                .attr('text-anchor', 'end')
                .text(function(d) {
                    return d['label'];
                });
    }

    return this;
}
