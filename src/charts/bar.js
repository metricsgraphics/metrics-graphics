// BARCHART:
// x - function that processes data
//     - pass in a feature name, get a count
//     - have raw feature: value function
// - need a way of changing the y axis and x axis
// - need to sort out rollovers
charts.bar = function(args) {
    this.args = args;

    this.init = function(args) {
        raw_data_transformation(args);
        process_categorical_variables(args);
        init(args);
        x_axis(args);
        y_axis_categorical(args);
        return this;
    }

    this.mainPlot = function() {

        var svg = d3.select(args.target + ' svg');

        var g;

        //remove the old histogram, add new one
        if($(args.target + ' svg .barplot').length > 0) {
            $(args.target + ' svg .barplot')
                .remove();
        }

        var data = args.data[0];

        var g = svg.append('g')
            .classed('barplot', true);

        var appropriate_height = args.scales.Y.rangeBand()/1.5;
        g.selectAll('.bar')
            .data(data).enter().append('rect')
            .classed('bar', true)
            .attr('x', args.scales.X(0))
            .attr('y', function(d){
                return args.scalefns.yf(d) + appropriate_height/2;
            })
            .attr('height', appropriate_height)
            .attr('width', function(d){ return args.scalefns.xf(d) - args.scales.X(0)});
        if (args.predictor_accessor){
            var pp=args.predictor_proportion;
            var pp0 = pp-1;
            // thick line  through bar;
            g.selectAll('.prediction')
                .data(data)
                .enter().append("rect")
                    .attr('x', args.scales.X(0))
                    .attr('y', function(d){
                        return args.scalefns.yf(d) + pp0*appropriate_height/(pp*2) + appropriate_height/2;
                    })
                    .attr('height', appropriate_height/pp)
                    .attr('width', function(d){
                        return args.scales.X(d[args.predictor_accessor]) - args.scales.X(0);
                    })
                    .attr('fill', '#36454f');
        }
        if (args.baseline_accessor){
            g.selectAll('.baseline')
                .data(data)
                .enter().append("line")
                    .attr('x1', function(d){return args.scales.X(d[args.baseline_accessor])})
                    .attr('x2', function(d){return args.scales.X(d[args.baseline_accessor])})
                    .attr('y1', function(d){
                        return args.scalefns.yf(d)+appropriate_height/2-appropriate_height/pp + appropriate_height/2;
                    })
                    .attr('y2', function(d){
                        return args.scalefns.yf(d)+appropriate_height/2+appropriate_height/pp + appropriate_height/2;
                    })
                    .attr('stroke-width', 2)
                    .attr('stroke', '#36454f');
        }
        return this;
    }

    this.markers = function() {
        markers(args);
        return this;
    };

    this.rollover = function() {
        var svg = d3.select(args.target + ' svg');
        var g;
        
        //remove the old rollovers if they already exist
        if($(args.target + ' svg .transparent-rollover-rect').length > 0) {
            $(args.target + ' svg .transparent-rollover-rect').remove();
        }
        if($(args.target + ' svg .active_datapoint').length > 0) {
            $(args.target + ' svg .active_datapoint').remove();
        }

        //rollover text
        svg.append('text')
            .attr('class', 'active_datapoint')
            .attr('xml:space', 'preserve')
            .attr('x', args.width - args.right)
            .attr('y', args.top / 2)
            .attr('dy', '.35em')
            .attr('text-anchor', 'end');

        var g = svg.append('g')
            .attr('class', 'transparent-rollover-rect')

        //draw rollover bars
        var bar = g.selectAll(".bar")
            .data(args.data[0])
                .enter().append("rect")
                    .attr("x", args.scales.X(0))
                    .attr("y", args.scalefns.yf)
                    .attr('width', args.width)
                    .attr('height', args.scales.Y.rangeBand()+2)
                    .attr('opacity', 0)
                    .on('mouseover', this.rolloverOn(args))
                    .on('mouseout', this.rolloverOff(args));
    }

    this.rolloverOn = function(args) {
        var svg = d3.select(args.target + ' svg');
        var x_formatter = d3.time.format('%Y-%m-%d');

        return function(d, i) {
            svg.selectAll('text')
                .filter(function(g, j) {
                    return d == g;
                })
                .attr('opacity', 0.3);

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

            //highlight active bar
            d3.selectAll($(args.target + ' svg g.barplot .bar:eq(' + i + ')'))
                .classed('active', true);

            //update rollover text
            if (args.show_rollover_text) {
                svg.select('.active_datapoint')
                    .text(function() {
                        if(args.time_series) {
                            var dd = new Date(+d[args.x_accessor]);
                            dd.setDate(dd.getDate());
                            
                            return fmt(dd) + '  ' + args.yax_units 
                                + num(d[args.y_accessor]);
                        }
                        else {
                            return d[args.y_accessor] + ': ' + num(d[args.x_accessor]);
                        }
                    });                
            }

            if(args.rollover_callback) {
                args.rollover_callback(d, i);
            }
        }
    }

    this.rolloverOff = function(args) {
        var svg = d3.select(args.target + ' svg');

        return function(d, i) {
            //reset active bar
            d3.selectAll($(args.target + ' svg g.barplot .bar:eq(' + i + ')'))
                .classed('active', false);
            
            //reset active data point text
            svg.select('.active_datapoint')
                .text('');
        }
    }

    this.init(args);
    return this;
}
