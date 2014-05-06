'use strict';

var moz = {};
moz.defaults = {};
moz.defaults.all = {
    scales: {},
    scalefns: {},
    width: 350,
    height: 220,
    data: [],
    left: 50,
    right: 10,
    markers: null, // sets the marker lines
    x_accessor: 'date',
    y_accessor: 'value',
    y_max_accessor: 'value',
    list: false,
    goal: null,
    area: true,
    top: 40,
    bottom: 30,
    xax_tick: 5,
    min_x: null,
    min_y: null,
    xax_count: 8,
    yax_tick: 5,
    yax_count: 5,
    decimal: false,
    buffer: 8,
    type: 'count',
    target: '#viz',
    xax_date_format: function(d) {
        var df = d3.time.format('%b %d');
        return df(d);
    }
}

var charts = {};

function moz_chart() {
    var args = arguments[0];
    if (!args) { args = {}; }
    args = _.defaults(args, moz.defaults.all);
    
    var g = '';
    if (args.list) {
        args.x_accessor = 0;
        args.y_accessor = 1;
    }
    
    //build the chart (assuming line chart for now)
    charts.line(args)
        .markers()
        .mainPlot()
        .rollover();
}



charts.line = function(args) {
    this.args = args;

    this.init = function(args) {
        //do we need to clean up dates? assume we always do for now
        var fff = d3.time.format('%Y-%m-%d');
        args.data = _.map(args.data, function(d) {
            d['date'] = fff.parse(d['date']);
            return d;
        });
    
        d3.select(args.target)
            .append('svg')
                .attr('width', args.width)
                .attr('height', args.height);
            
        args.scalefns.xf = function(di) {
            return args.scales.X(di[args.x_accessor]);
        }
    
        args.scalefns.yf = function(di) {
            return args.scales.Y(di[args.y_accessor]);
        }
        
        //we kind of need axes in all cases
        this.xAxis(args);
        this.yAxis(args);
        
        return this;
    }
    
    this.xAxis = function(args) {
        var svg = d3.select(args.target + ' svg');
        var g;
        
        // determine the x bounds, given the data, or go with specified range
        var min_x = args.min_x ? args.min_x : args.data[0][args.x_accessor];
        var max_x = args.max_x ? args.max_x : _.last(args.data)[args.x_accessor];

        args.scales.X = d3.time.scale()
            .domain([min_x, max_x])
            .range([args.left + args.buffer, args.width - args.right]);
    
        // x axis
        g = svg.append('g')
            .attr('class', 'x-axis');
        
        g.append('line')
            .attr('x1', args.scales.X(_.last(args.scales.X.ticks(args.xax_count))))
            .attr('x2', args.scales.X(_.first(args.scales.X.ticks(args.xax_count))))
            .attr('y1', args.height - args.bottom)
            .attr('y2', args.height - args.bottom);
        
        g.selectAll('.xax-ticks')
            .data(args.scales.X.ticks(args.xax_count)).enter()
                .append('line')
                    .attr('x1', args.scales.X)
                    .attr('x2', args.scales.X)
                    .attr('y1', args.height - args.bottom)
                    .attr('y2', args.height - args.bottom + args.xax_tick);
                
        g.selectAll('.xax-labels')
            .data(args.scales.X.ticks(args.xax_count)).enter()
                .append('text')
                    .attr('x', args.scales.X)
                    .attr('y', args.height - args.bottom + args.xax_tick * 7 / 3)
                    .attr('dy', '.50em')
                    .attr('text-anchor', 'middle')
                    .text(function(d) {
                        return args.xax_date_format(d);
                    })
            
        //are we adding years to x-axis
        var years = d3.time.years(
            d3.min(args.data, function(d) { return d[args.x_accessor]; }),
            d3.max(args.data, function(d) { return d[args.x_accessor]; })
        );
        
        g = svg.append('g')
            .attr('class', 'year-marker');
        
        g.selectAll('.year_marker')
            .data(years).enter()
                .append('line')
                    .attr('x1', args.scales.X)
                    .attr('x2', args.scales.X)
                    .attr('y1', args.top)
                    .attr('y2', args.height - args.bottom);
                
        var yformat = d3.time.format('%Y');
        g.selectAll('.year_marker')
            .data(years).enter()
                .append('text')
                    .attr('x', args.scales.X)
                    .attr('y', args.height - args.bottom + 28)
                    .attr('text-anchor', 'middle')
                    .text(function(d) {
                        return yformat(d)
                    });
                    
        return this;
    }
    
    this.yAxis = function(args) {
        var svg = d3.select(args.target + ' svg');
        var g;
        
        args.scales.Y = d3.scale.linear()
            .domain([0, Math.max(d3.max(args.data, function(d) {
                return d[args.y_accessor]
            }) * 10 / 9, args.goal * 10 / 9)])
            .range([args.height - args.bottom - args.buffer, args.top]);
        
        
        var yax_format; // currently, {count, percentage}
        if (args.type == 'count') {
            yax_format = function(f) {
                var pf = d3.formatPrefix(f);
                return pf.scale(f) + pf.symbol;
            };
        }
        else {
            yax_format = function(d_) {
                var n = d3.format('%p');
                return n(d_);
            }
        }
            
        // y axis
        g = svg.append('g')
            .attr('class', 'y-axis');
    
        g.append('line')
            .attr('x1', args.left)
            .attr('x2', args.left)
            .attr('y1', args.scales.Y(_.first(args.scales.Y.ticks(args.yax_count))))
            .attr('y2', args.scales.Y(_.last(args.scales.Y.ticks(args.yax_count))));
        
        g.selectAll('.yax-ticks')
            .data(args.scales.Y.ticks(args.yax_count)).enter()
                .append('line')
                    .attr('x1', args.left)
                    .attr('x2', args.left - args.yax_tick)
                    .attr('y1', args.scales.Y)
                    .attr('y2', args.scales.Y);
                
        g.selectAll('.yax-labels')
            .data(args.scales.Y.ticks(args.yax_count)).enter()
                .append('text')
                    .attr('x', args.left - args.yax_tick * 3 / 2)
                    .attr('dx', -3).attr('y', args.scales.Y)
                    .attr('dy', '.35em')
                    .attr('text-anchor', 'end')
                    .text(function(d, i) {
                        var o = yax_format(d);
                        return o;
                    })
                    
        return this;
    }
    
    this.mainPlot = function() {
        var svg = d3.select(args.target + ' svg');
        var g;
          
        // main area
        if (args.area) {
            var area = d3.svg.area()
                .x(args.scalefns.xf)
                .y0(args.scales.Y(0))
                .y1(args.scalefns.yf)
                .interpolate('cardinal');
        
            svg.append('path')
                .attr('class', 'main-area')
                .attr('d', area(args.data));
        }
    
        // main line
        var line = d3.svg.line()
            .x(args.scalefns.xf)
            .y(args.scalefns.yf)
            .interpolate('cardinal');
        
        svg.append('path')
            .attr('class', 'main-line')
            .attr('d', line(args.data));
            
        return this;
    }
    
    this.markers = function() {
        var svg = d3.select(args.target + ' svg');
        var g;
        
        if (args.markers) {
            g = svg.append('g')
                .attr('class', 'markers');
            
            g.selectAll('.markers')
                .data(args.markers)
                .enter().append('line')
                    .attr('x1', function(d) {
                        return args.scales.X(d['date'])
                    })
                    .attr('x2', function(d) {
                        return args.scales.X(d['date'])
                    })
                    .attr('y1', args.top)
                    .attr('y2', function() {
                        return args.height - args.bottom - args.buffer;
                    })
                    .attr('stroke-dasharray', '3,1');
                
            g.selectAll('.markers')
                .data(args.markers)
                .enter().append('text')
                    .attr('x', function(d) {
                        return args.scales.X(d['date'])
                    })
                    .attr('y', args.top - 8)
                    .attr('text-anchor', 'middle')
                    .text(function(d) {
                        return d['label'];
                    });
        }
        
        return this;
    }

    this.rollover = function() {
        var svg = d3.select(args.target + ' svg');
        var g;
        
        g = svg.append('g')
        .attr('class', 'point');
                 
        g.selectAll('.point')
            .data(args.data).enter()
                .append('circle')
                    .classed('last_point', function(d, i) {
                        return i == args.data.length - 1;
                    })
                    .attr('cx', args.scalefns.xf)
                    .attr('cy', args.scalefns.yf)
                    .attr('r', 2.5)
                    .attr('opacity', function(d, i) {
                        return (i == args.data.length - 1) ? 0.85 : 0;
                    });

        //main rollover
        g = svg.append('g')
            .attr('class', 'transparent-rollover-rect');
        
        g.selectAll('.periods')
            .data(args.data).enter()
                .append('rect')
                    .attr('x', function(d, i) {
                        var current_date = d;
                        var next_date, previous_date;
                        var x_coord;
                    
                        if (i == 0) {
                            next_date = args.data[1];
                            x_coord = args.scalefns.xf(current_date) 
                                - (args.scalefns.xf(next_date) 
                                - args.scalefns.xf(current_date)) / 2;
                        }
                        else {
                            previous_date = args.data[i - 1];
                            x_coord = args.scalefns.xf(current_date) 
                                - (args.scalefns.xf(current_date) 
                                - args.scalefns.xf(previous_date)) / 2;
                        }
                        
                        return x_coord;    
                    })
                    .attr('y', args.top)
                    .attr('width', function(d, i) {
                        if (i != args.data.length - 1) {
                            return args.scalefns.xf(args.data[i + 1]) - args.scalefns.xf(d);
                        }
                        else {
                            return args.scalefns.xf(args.data[1]) 
                                - args.scalefns.xf(args.data[0]);
                        }
                    })
                    .attr('height', args.height - args.bottom)
                    .on('mouseover', this.rolloverOn(svg, args))
                    .on('mouseout', this.rolloverOff(svg, args));
        
        return this;
    }
    
    this.rolloverOn = function() {
        var svg = d3.select(args.target + ' svg');
        
        return function(d, i) {
            d3.selectAll('circle')
                .attr('opacity', 0)
                .filter(function(g, j) {
                    return d == g;
                })
                .attr('opacity', 0.85);
            
            svg.selectAll('text')
                .filter(function(g, j) {
                    return d == g;
                })
                .attr('opacity', 0.3);
        
            var fmt = d3.time.format('%b %e, %Y');
        
            if (args.type == 'count') {
                var num = function(d_) {
                    var n = d3.format("0,000");
                    d_ = args.decimal ? d3.round(d_, 2) : d3.round(d_);
                    return n(d_);
                }
            }
            else {
                var num = function(d_) {
                    var n = d3.format('%');
                    return n(d_);
                }
            }
        
            var dd = new Date(+d[args.x_accessor]);
            dd.setDate(dd.getDate());
        
            svg.append('text')
                .classed('goals_rollover_text', true)
                .attr('xml:space', 'preserve')
                .attr('x', args.width - args.right + 4)
                .attr('y', args.top / 2)
                .attr('text-anchor', 'end')
                .text(function() {
                    return fmt(dd) + '  ' + num(d[args.y_accessor])
                });
        }
    }
    
    this.rolloverOff = function() {
        var svg = d3.select(args.target + ' svg');
        
        return function(d, i) {
            svg.selectAll('circle')
                .attr('opacity', 0);
            
            svg.select('.goals_rollover_text')
                .remove();
            
            d3.selectAll('circle.last_point')
                .attr('opacity', 0.85);
        }
    }
    
    this.init(args);
    return this;
}