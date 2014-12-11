charts.histogram = function(args) {
    'use strict';
    this.args = args;

    this.init = function(args) {
        raw_data_transformation(args);
        process_histogram(args);
        init(args);
        x_axis(args);
        y_axis(args);
        this.$svg = document.querySelector(args.target + ' svg');
        this.svg = d3.select(this.$svg);
        return this;
    }

    this.mainPlot = function() {
        var g;

        //remove the old histogram, add new one
        var oldHistogram = this.$svg.querySelector('.histogram');

        if(oldHistogram)
          oldHistogram.parentNode.removeChild(oldHistogram);

        var g = this.svg.append("g")
            .attr("class", "histogram");

        var bar = g.selectAll(".bar")
            .data(args.data[0])
                .enter().append("g")
                    .attr("class", "bar")
                    .attr("transform", function(d) {
                        return "translate(" + args.scales.X(d[args.x_accessor]).toFixed(2) 
                            + "," + args.scales.Y(d[args.y_accessor]).toFixed(2) + ")";
                        });

        //draw bars
        bar.append("rect")
            .attr("x", 1)
            .attr("width", function(d, i) {
                return (args.scalefns.xf(args.data[0][1])
                    - args.scalefns.xf(args.data[0][0])
                    - args.bar_margin).toFixed(2);
            })
            .attr("height", function(d) {
                if(d[args.y_accessor] == 0)
                    return 0;

                return (args.height - args.bottom - args.buffer 
                    - args.scales.Y(d[args.y_accessor])).toFixed(2);
            });

        return this;
    }

    this.markers = function() {
        markers(args);
        return this;
    };

    this.rollover = function() {
        var g;
        
        //remove the old rollovers if they already exist
        [
          this.$svg.querySelector('.transparent-rollover-rect'),
          this.$svg.querySelector('.active_datapoint')
        ].forEach(function(e, i) {
        
          if(!e)
            return;

          e.parentNode.removeChild(e);
        })
         
        //rollover text
        this.svg.append('text')
            .attr('class', 'active_datapoint')
            .attr('xml:space', 'preserve')
            .attr('x', args.width - args.right)
            .attr('y', args.top / 2)
            .attr('text-anchor', 'end');

        var g = this.svg.append('g')
            .attr('class', 'transparent-rollover-rect')

        //draw rollover bars
        var bar = g.selectAll(".bar")
            .data(args.data[0])
                .enter().append("g")
                    .attr("class", "rollover-rects")
                    .attr("transform", function(d) {
                        return "translate(" + (args.scales.X(d[args.x_accessor])) + "," + 0 + ")";
                    });

        bar.append("rect")
            .attr("x", 1)
            .attr("y", 0)
            .attr("width", function(d, i) {
                if (i != args.data[0].length - 1) {
                    return (args.scalefns.xf(args.data[0][i + 1]) 
                        - args.scalefns.xf(d)).toFixed(2);
                }
                else {
                    return (args.scalefns.xf(args.data[0][1])
                        - args.scalefns.xf(args.data[0][0])).toFixed(2);
                }
            })
            .attr("height", function(d) {
                return args.height;
            })
            .attr('opacity', 0)
            .on('mouseover', this.rolloverOn(args))
            .on('mouseout', this.rolloverOff(args));
    }

    this.rolloverOn = function(args) {
        var svg = this.svg;
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
            var el = document.querySelectorAll(args.target + ' svg .bar')[i]

            d3.selectAll(el.childNodes)
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
                            return args.x_accessor + ': ' + num(d[args.x_accessor]) 
                                + ', ' + args.y_accessor + ': ' + args.yax_units 
                                + num(d[args.y_accessor]);
                        }
                    });                
            }

            if(args.rollover_callback) {
                args.rollover_callback(d, i);
            }
        }
    }

    this.rolloverOff = function(args) {
        var svg = this.svg;

        return function(d, i) {

            var el = document.querySelectorAll(args.target + ' svg .bar')[i]

            //reset active bar
            d3.selectAll(el.childNodes)
                .classed('active', false);

            //reset active data point text
            svg.select('.active_datapoint')
                .text('');
        }
    }

    this.init(args);
    return this;
}
