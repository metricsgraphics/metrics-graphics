function chart_title(args) {
    'use strict';

    var svg = mg_get_svg_child_of(args.target);

    //remove the current title if it exists
    svg.select('.mg-header').remove();

    if (args.target && args.title) {
        var chartTitle = svg.insert('text')
            .attr('class', 'mg-header')
            .attr('x', (args.width + args.left - args.right) / 2)
            .attr('y', 10)
            .attr('text-anchor', 'middle')
            .attr('dy', '0.55em');

        chartTitle.append('tspan')
            .attr('class', 'mg-chart-title')
            .text(args.title);

        //show and activate the question mark if we have a description
        if (args.show_tooltips && args.description) {
            chartTitle.append('tspan')
                .attr('class', 'mg-chart-description')
                .attr('dx', '0.1em')
                .text('⊛');

            //now that the title is an svg text element, we'll have to trigger
            //mouseenter, mouseleave events manually for the popover to work properly
            var $chartTitle = $(chartTitle.node());
            $chartTitle.popover({
                html: true,
                animation: false,
                content: args.description,
                placement: 'top',
                container: args.target,
                trigger: 'manual',
                template: '<div class="popover mg-popover"><div class="arrow"></div><div class="popover-inner"><h3 class="popover-title"></h3><div class="popover-content"><p></p></div></div></div>'
            }).on('mouseenter', function() {
                $(this).popover('show');
                $(args.target).select('.popover')
                    .on('mouseleave', function () {
                        $chartTitle.popover('hide');
                    });
            }).on('mouseleave', function () {
                setTimeout(function () {
                    if (!$('.popover:hover').length) {
                        $chartTitle.popover('hide');
                    }
                }, 120);
            });
        }
    }

    if (args.error) {
        error(args);
    }
}

MG.chart_title = chart_title;
