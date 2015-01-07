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

        // delete child elements
        d3.select(args.target).selectAll('svg *').remove()

        var svg = d3.select(args.target).select('svg')

        // add missing class
        svg.classed('mg-missing', true);

        // do we need to clear the legend?
        if(args.legend_target)
            $(args.legend_target).html('');

        // add missing text
        svg.selectAll('.mg-missing-text').data([args.missing_text])
          .enter().append('text')
            .attr('class', 'mg-missing-text')
            .attr('x', args.width / 2)
            .attr('y', args.height / 2)
            .attr('dy', '.50em')
            .attr('text-anchor', 'middle')
            .text(args.missing_text)

        return this;
    }

    this.init(args);
    return this;
}
