

function markers(args) {
    'use strict';
    var svg = mg_get_svg_child_of(args.target);
    var gm;
    var gb;

    //remove existing markers and baselines
    svg.selectAll('.mg-markers').remove();
    svg.selectAll('.mg-baselines').remove();

    if (args.markers) {
        gm = svg.append('g')
            .attr('class', 'mg-markers');

        gm.selectAll('.mg-markers')
            .data(args.markers.filter(inRange))
            .enter()
            .append('line')
                .attr('x1', xPositionFixed)
                .attr('x2', xPositionFixed)
                .attr('y1', args.top)
                .attr('y2', function() {
                    return args.height - args.bottom - args.buffer;
                })
                .attr('class', function (d) {
                    return d.lineclass;
                })
                .attr('stroke-dasharray', '3,1');

        gm.selectAll('.mg-markers')
            .data(args.markers.filter(inRange))
            .enter()
            .append('text')
                .attr('class', function (d) {
                    return d.textclass ? 'mg-marker-text ' + d.textclass : 'mg-marker-text';
                })
                .attr('x', xPosition)
                .attr('y', args.top * 0.95)
                .attr('text-anchor', 'middle')
                .text(function(d) {
                    return d.label;
                })
                .each(function(d) {
                    if(d.click) {
                        d3.select(this)
                            .style('cursor', 'pointer')
                            .on('click', d.click);
                    }
                });

        preventHorizontalOverlap(gm.selectAll('.mg-marker-text')[0], args);
    }

    function xPosition(d) {
        return args.scales.X(d[args.x_accessor]);
    }

    function xPositionFixed(d) {
        return xPosition(d).toFixed(2);
    }

    function inRange(d) {
        return (args.scales.X(d[args.x_accessor]) > args.buffer + args.left)
            && (args.scales.X(d[args.x_accessor]) < args.width - args.buffer - args.right);
    }

    if (args.baselines) {
        gb = svg.append('g')
            .attr('class', 'mg-baselines')
            .classed('mg-baselines-small', args.use_small_class);

        gb.selectAll('.mg-baselines')
            .data(args.baselines)
            .enter().append('line')
                .attr('x1', args.left + args.buffer)
                .attr('x2', args.width-args.right-args.buffer)
                .attr('y1', function(d){
                    return args.scales.Y(d.value).toFixed(2);
                })
                .attr('y2', function(d){
                    return args.scales.Y(d.value).toFixed(2);
                });

        gb.selectAll('.mg-baselines')
            .data(args.baselines)
            .enter().append('text')
                .attr('x', args.width-args.right - args.buffer)
                .attr('y', function(d){
                    return args.scales.Y(d.value).toFixed(2);
                })
                .attr('dy', -3)
                .attr('text-anchor', 'end')
                .text(function(d) {
                    return d.label;
                });
    }

    return this;
}

MG.markers = markers;
