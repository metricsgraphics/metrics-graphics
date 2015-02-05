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
                .attr('stroke-dasharray', '3,1');

        gm.selectAll('.mg-markers')
            .data(args.markers.filter(inRange))
            .enter()
            .append('text')
                .attr('class', 'mg-marker-text')
                .attr('x', xPosition)
                .attr('y', args.top - 8)
                .attr('text-anchor', 'middle')
                .text(function(d) {
                    return d.label;
                });

        preventOverlap(gm.selectAll('.mg-marker-text'));
    }

    if (args.baselines) {
        gb = svg.append('g')
            .attr('class', 'mg-baselines');

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

    function preventOverlap (labels) {
        var prev;
        labels.each(function(d, i) {
        if (i > 0) {
            var thisbb = this.getBoundingClientRect();

            if (isOverlapping(this, labels)) {
                var node = d3.select(this), newY = +node.attr('y');
                if (newY + 8 == args.top) {
                    newY = args.top - 16;
                }
                node.attr('y', newY);
            }
        }
        prev = this;
      });
    }

    function isOverlapping(element, labels) {
        var bbox = element.getBoundingClientRect();
        for(var i = 0; i < labels.length; i++) {
            var elbb = labels[0][i].getBoundingClientRect();
            if (
                labels[0][i] !== element &&
                ((elbb.right > bbox.left && elbb.left > bbox.left && bbox.top === elbb.top) ||
                (elbb.left < bbox.left && elbb.right > bbox.left && bbox.top === elbb.top))
            ) return true;
        }
        return false;
    }

    function xPosition (d) {
        return args.scales.X(d[args.x_accessor]);
    }

    function xPositionFixed (d) {
        return xPosition(d).toFixed(2);
    }

    function inRange (d) {
        return (args.scales.X(d[args.x_accessor]) > args.buffer + args.left)
            && (args.scales.X(d[args.x_accessor]) < args.width - args.buffer - args.right);
    }

    return this;
}
