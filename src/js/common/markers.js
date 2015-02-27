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

        preventOverlap(gm.selectAll('.mg-marker-text')[0]);
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

    function preventOverlap(labels) {
        if (labels.length == 1) {
            return;
        }

        //see if each of our labels overlaps any of the other labels
        for (var i = 0; i < labels.length; i++) {
            //if so, nudge it up a bit, if the label it intersects hasn't already been nudged
            if (isOverlapping(labels[i], labels)) {
                var node = d3.select(labels[i]);
                var newY = +node.attr('y');
                if (newY + 8 == args.top) {
                    newY = args.top - 16;
                }
                node.attr('y', newY);
            }
        }
    }

    function isOverlapping(element, labels) {
        var element_bbox = element.getBoundingClientRect();

        for (var i = 0; i < labels.length; i++) {
            if (labels[i] == element) {
                continue;
            }

            //check to see if this label overlaps with any of the other labels
            var sibling_bbox = labels[i].getBoundingClientRect();
            if (element_bbox.top === sibling_bbox.top && 
                    !(sibling_bbox.left > element_bbox.right || sibling_bbox.right < element_bbox.left)
                ) {
                return true;
            }
        }
        return false;
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

    return this;
}
