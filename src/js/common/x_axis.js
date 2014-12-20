function x_rug(args) {
    'use strict';
    var buffer_size = args.chart_type =='point' 
        ? args.buffer / 2 
        : args.buffer;

    var svg = d3.select($(args.target).find('svg').get(0));
    var all_data=[];
    for (var i=0; i<args.data.length; i++) {
        for (var j=0; j<args.data[i].length; j++) {
            all_data.push(args.data[i][j]);
        }
    }

    var rug = svg.selectAll('line.mg-x-rug').data(all_data);

    //set the attributes that do not change after initialization, per
    //D3's general update pattern
    rug.enter().append('svg:line')
        .attr('class', 'mg-x-rug')
        .attr('opacity', 0.3);

    //remove rug elements that are no longer in use
    rug.exit().remove();

    //set coordinates of new rug elements
    rug.exit().remove();

    rug.attr('x1', args.scalefns.xf)
        .attr('x2', args.scalefns.xf)
        .attr('y1', args.height-args.top+buffer_size)
        .attr('y2', args.height-args.top);

    if (args.color_accessor) {
        rug.attr('stroke', args.scalefns.color);
        rug.classed('mg-x-rug-mono', false);
    }
    else {
        rug.attr('stroke', null);
        rug.classed('mg-x-rug-mono', true);
    }
}

function x_axis(args) {
    'use strict';
    var svg = d3.select($(args.target).find('svg').get(0));
    var $svg = $($(args.target).find('svg').get(0));

    var g;
    var min_x;
    var max_x;

    args.scalefns.xf = function(di) {
        return args.scales.X(di[args.x_accessor]);
    }

    if (args.chart_type == 'point') {
        // figure out 
        var min_size, max_size, min_color, max_color, size_range, color_range, size_domain, color_domain;
        if (args.color_accessor != null) {
            if (args.color_domain == null) {
                if (args.color_type=='number') {
                    min_color = d3.min(args.data[0], function(d) {
                        return d[args.color_accessor]
                    });

                    max_color = d3.max(args.data[0], function(d){
                        return d[args.color_accessor]
                    });

                    color_domain = [min_color, max_color];
                }
                else if (args.color_type == 'category') {
                    color_domain = d3.set(args.data[0]
                        .map(function(d) {
                            return d[args.color_accessor];
                        }))
                        .values();

                    color_domain.sort();
                }
            }
            else {
                color_domain = args.color_domain;
            }

            if (args.color_range == null){
                if (args.color_type=='number') {
                    color_range = ['blue', 'red'];    
                } else {
                    color_range = null;
                }
                
            } else {
                color_range = args.color_range;
            }

            if (args.color_type=='number') {
                args.scales.color = d3.scale.linear()
                    .domain(color_domain)
                    .range(color_range)
                    .clamp(true);    
            } else {
                args.scales.color = args.color_range != null 
                    ? d3.scale.ordinal().range(color_range) 
                    : (color_domain.length > 10 
                        ? d3.scale.category20() : d3.scale.category10());

                args.scales.color.domain(color_domain);
            }

            args.scalefns.color = function(di) {
                return args.scales.color(di[args.color_accessor]);
            };
        }

        if (args.size_accessor != null) {
            if (args.size_domain == null) {
                min_size = d3.min(args.data[0], function(d){
                    return d[args.size_accessor]
                });

                max_size = d3.max(args.data[0], function(d){
                    return d[args.size_accessor];
                });

                size_domain = [min_size, max_size];
            } else {
                size_domain = args.size_domain;
            }
            if (args.size_range == null) {
                size_range = [1,5];//args.size_domain;
            } else {
                size_range = args.size_range;
            }

            args.scales.size=d3.scale.linear()
                .domain(size_domain)
                .range(size_range)
                .clamp(true);

            args.scalefns.size = function(di) {
                return args.scales.size(di[args.size_accessor]);
            };
        }
    }

    var last_i;

    if(args.chart_type == 'line') {
        for(var i=0; i<args.data.length; i++) {
            last_i = args.data[i].length-1;

            if(args.data[i][0][args.x_accessor] < min_x || !min_x)
                min_x = args.data[i][0][args.x_accessor];

            if(args.data[i][last_i][args.x_accessor] > max_x || !max_x)
                max_x = args.data[i][last_i][args.x_accessor];
        }
    }
    else if(args.chart_type == 'point') {
        max_x = d3.max(args.data[0], function(d){return d[args.x_accessor]});
        min_x = d3.min(args.data[0], function(d){return d[args.x_accessor]});
    }
    else if(args.chart_type == 'histogram') {
        min_x = d3.min(args.data[0], function(d){return d[args.x_accessor]});
        max_x = d3.max(args.data[0], function(d){return d[args.x_accessor]});
        
        //force override xax_format
        //todo revisit to see if this makes sense        
        args.xax_format = function(f) {
            if (f < 1.0) {
                //don't scale tiny values
                return args.yax_units + d3.round(f, args.decimals);
            }
            else {
                var pf = d3.formatPrefix(f);
                return args.xax_units + pf.scale(f) + pf.symbol;
            }
        }
    }
    else if(args.chart_type == 'bar') {
        //min_x = d3.min(args.data[0], function(d){return d[args.value_accessor]});

        min_x = 0; // TODO: think about what actually makes sense.
        max_x = d3.max(args.data[0], function(d){
            var trio = [];
            trio.push(d[args.x_accessor]);

            if (args.baseline_accessor!=null){
                trio.push(d[args.baseline_accessor]);
            };

            if (args.predictor_accessor!=null){
                trio.push(d[args.predictor_accessor]);
            }

            return Math.max.apply(null, trio);
        });

        args.xax_format = function(f) {
            if (f < 1.0) {
                //don't scale tiny values
                return args.yax_units + d3.round(f, args.decimals);
            }
            else {
                var pf = d3.formatPrefix(f);
                return args.xax_units + pf.scale(f) + pf.symbol;
            }
        }
    }

    min_x = args.min_x ? args.min_x : min_x;
    max_x = args.max_x ? args.max_x : max_x;
    args.x_axis_negative = false;

    if (!args.time_series) {
        if (min_x < 0){
            min_x = min_x  - (max_x * (args.inflator-1));
            args.x_axis_negative = true;
        }
    }

    // this is for some charts that might need additional buffer, such as the bar chart.
    var additional_buffer;

    if (args.chart_type == 'bar'){
        additional_buffer = args.buffer*5;
    } else {
        additional_buffer = 0;
    }

    args.scales.X = (args.time_series) 
        ? d3.time.scale() 
        : d3.scale.linear();

    args.scales.X
        .domain([min_x, max_x])
        .range([args.left + args.buffer, args.width - args.right - args.buffer - additional_buffer]);

    //remove the old x-axis, add new one
    $svg.find('.mg-x-axis').remove();

    if (!args.x_axis) return this;

    //x axis
    g = svg.append('g')
        .classed('mg-x-axis', true)
        .classed('mg-x-axis-small', args.use_small_class);

    var last_i = args.scales.X.ticks(args.xax_count).length-1;

    //are we adding a label?
    if(args.x_label) {
        g.append('text')
            .attr('class', 'label')
            .attr('x', function() {
                return args.left + args.buffer
                    + ((args.width - args.right - args.buffer)
                        - (args.left + args.buffer)) / 2;
            })
            .attr('y', (args.height - args.bottom / 2).toFixed(2))
            .attr('dy', '.50em')
            .attr('text-anchor', 'middle')
            .text(function(d) {
                return args.x_label;
            })
    }

    if(args.chart_type != 'bar' && !args.x_extended_ticks && !args.y_extended_ticks) {
        //extend axis line across bottom, rather than from domain's min..max
        g.append('line')
            .attr('x1', 
                (args.concise == false || args.xax_count == 0)
                    ? args.left + args.buffer
                    : (args.scales.X(args.scales.X.ticks(args.xax_count)[0])).toFixed(2)
            )
            .attr('x2', 
                (args.concise == false || args.xax_count == 0)
                    ? args.width - args.right - args.buffer
                    : (args.scales.X(args.scales.X.ticks(args.xax_count)[last_i])).toFixed(2)
            )
            .attr('y1', args.height - args.bottom)
            .attr('y2', args.height - args.bottom);
    }

    //add x ticks
    g.selectAll('.mg-xax-ticks')
        .data(args.scales.X.ticks(args.xax_count)).enter()
            .append('line')
                .attr('x1', function(d) { return args.scales.X(d).toFixed(2); })
                .attr('x2', function(d) { return args.scales.X(d).toFixed(2); })
                .attr('y1', args.height - args.bottom)
                .attr('y2', function() {
                    return (args.x_extended_ticks)
                        ? args.top
                        : args.height - args.bottom + args.xax_tick_length;
                })
                .attr('class', function() {
                    if(args.x_extended_ticks)
                        return 'mg-extended-x-ticks';
                });

    g.selectAll('.mg-xax-labels')
        .data(args.scales.X.ticks(args.xax_count)).enter()
            .append('text')
                .attr('x', function(d) { return args.scales.X(d).toFixed(2); })
                .attr('y', (args.height - args.bottom + args.xax_tick_length * 7 / 3).toFixed(2))
                .attr('dy', '.50em')
                .attr('text-anchor', 'middle')
                .text(function(d) {
                    return args.xax_units + args.xax_format(d);
                })

    //are we adding years to x-axis
    if (args.time_series && args.show_years) {
        var min_x;
        var max_x;

        for (var i=0; i<args.data.length; i++) {
            last_i = args.data[i].length-1;

            if(args.data[i][0][args.x_accessor] < min_x || !min_x)
                min_x = args.data[i][0][args.x_accessor];
            if(args.data[i][last_i][args.x_accessor] > max_x || !max_x)
                max_x = args.data[i][last_i][args.x_accessor];
        }

        var years = d3.time.years(min_x, max_x);

        if (years.length == 0){
            var first_tick = args.scales.X.ticks(args.xax_count)[0];
            years = [first_tick];
        }

        //append year marker to x-axis group
        g = g.append('g')
            .classed('mg-year-marker', true)
            .classed('mg-year-marker-small', args.use_small_class); 

        g.selectAll('.mg-year-marker')
            .data(years).enter()
                .append('line')
                    .attr('x1', function(d) { return args.scales.X(d).toFixed(2); })
                    .attr('x2', function(d) { return args.scales.X(d).toFixed(2); })
                    .attr('y1', args.top)
                    .attr('y2', args.height - args.bottom);

        var yformat = d3.time.format('%Y');
        g.selectAll('.mg-year-marker')
            .data(years).enter()
                .append('text')
                    .attr('x', function(d) { return args.scales.X(d).toFixed(2); })
                    .attr('y', (args.height - args.bottom + args.xax_tick_length * 7 / 1.3).toFixed(2))
                    .attr('dy', args.use_small_class ? -3 : 0)//(args.y_extended_ticks) ? 0 : 0 )
                    .attr('text-anchor', 'middle')
                    .text(function(d) {
                        return yformat(d);
                    });
    };  

    if (args.x_rug){
        x_rug(args);
    }

    return this;
}
