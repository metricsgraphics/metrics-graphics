'use strict';

var each = function(obj, iterator, context) {
    // yanked out of underscore
    if (obj == null) return obj;
    if (Array.prototype.forEach && obj.forEach === Array.prototype.forEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, length = obj.length; i < length; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var k in obj) {
        if (iterator.call(context, obj[k], k, obj) === breaker) return;
      }
    }
    return obj;
};

function merge_with_defaults(obj){
    // taken from underscore
    each(Array.prototype.slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] === void 0) obj[prop] = source[prop];
        }
      }
    });
    return obj;
};


var charts = {};

function moz_chart() {
    var moz = {};
    moz.defaults = {};
    moz.defaults.all = {
        area: true,
        bottom: 30,
        buffer: 8,
        chart_type: 'line',
        data: [],
        decimal: false,
        format: 'count',
        goal: null,
        height: 220,
        inflator: 10/9, // for setting y axis max
        left: 50,
        linked: false,
        list: false,
        markers: null, // sets the marker lines
        max_x: null,
        max_y: null,
        min_x: null,
        min_y: null,
        right: 10,
        scalefns: {},
        scales: {},
        show_years: true,
        small_height_threshold: 120,
        small_text: false,
        small_width_threshold: 160,
        target: '#viz',
        time_series: true,
        top: 40,
        width: 350, 
        x_accessor: 'date',
        xax_count: 6,
        xax_format: function(d) {
            //assume date by default, user can pass in custom function
            var df = d3.time.format('%b %d');
            return df(d);
        },
        xax_tick: 5,
        xax_units: '',
        y_accessor: 'value',
        y_max_accessor: 'value',
        yax_count: 5,
        yax_tick: 5,
        yax_units: ''
    }

    var args = arguments[0];
    if (!args) { args = {}; }
    args = merge_with_defaults(args, moz.defaults.all);
    
    var g = '';
    if (args.list) {
        args.x_accessor = 0;
        args.y_accessor = 1;
    }
    
    //build the chart
    if(args.chart_type == 'missing-data')
        charts.missing(args);
    else
        charts.line(args).markers().mainPlot().rollover();
    
}

function chart_title(args) {
    var defaults = {
        target: null,
        title: null,
        description: null
    };
    var args = arguments[0];
    if (!args) { args = {}; }
    args = merge_with_defaults(args, defaults);
    
    if (args.target && args.title) {
        $(args.target).append('<h2 class="chart_title">' 
            + args.title + '<i class="fa fa-question-circle fa-inverse"></i></h2>');
            
        if (args.description){
            $(args.target + ' h2.chart_title')
                .popover({'content': args.description,
                    'trigger':'hover', 'placement': 'top'});
        }   
    }
}

function xAxis(args) {
    var svg = d3.select(args.target + ' svg');
    var g;
    var min_x;
    var max_x;

    args.scalefns.xf = function(di) {
            return args.scales.X(di[args.x_accessor]);
    }
    var last_i;
    for(var i=0; i<args.data.length; i++) {
        last_i = args.data[i].length-1;

        if(args.data[i][0][args.x_accessor] < min_x || !min_x)
            min_x = args.data[i][0][args.x_accessor];

        if(args.data[i][last_i][args.x_accessor] > max_x || !max_x)
            max_x = args.data[i][last_i][args.x_accessor];
    }

    min_x = args.min_x ? args.min_x : min_x;
    max_x = args.max_x ? args.max_x : max_x;
    
    args.scales.X = (args.time_series) 
        ? d3.time.scale() 
        : d3.scale.linear();
        
    args.scales.X
        .domain([min_x, max_x])
        .range([args.left + args.buffer, args.width - args.right-args.buffer]);

    // x axis
    g = svg.append('g')
        .classed('x-axis', true)
        .classed('x-axis-small', args.use_small_class);

    var last_i = args.scales.X.ticks(args.xax_count).length-1;

    g.append('line')
        .attr('x1', args.scales.X(args.scales.X.ticks(args.xax_count)[last_i] ))
        .attr('x2', args.scales.X(args.scales.X.ticks(args.xax_count)[0]))
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

        if (years.length==0){
            var first_tick = args.scales.X.ticks(args.xax_tick)[0];
            years = [first_tick];

        }

        g = svg.append('g')
            .classed('year-marker', true)
            .classed('year-marker-small', args.use_small_class); 
        
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
                    .attr('dy', args.use_small_class ? -3 : 0)
                    .attr('text-anchor', 'middle')
                    .text(function(d) {
                        return yformat(d);
                    });
    };         
    return this;
}
    
function yAxis(args) {
    var svg = d3.select(args.target + ' svg');
    var g;

    var min_y, max_y;

    args.scalefns.yf = function(di) {
        return args.scales.Y(di[args.y_accessor]);
    }

    var current_max, current_min;
    for(var i=0; i<args.data.length; i++) {
        if (i == 0){
            max_y = args.data[i][0][args.y_accessor];
            min_y = args.data[i][0][args.y_accessor];
        }
        current_min = d3.min(args.data[i], function(d){return d[args.y_accessor]})
        current_max = d3.max(args.data[i], function(d){return d[args.y_accessor]})

        max_y = Math.max(max_y, current_max);
        min_y = Math.min(min_y, current_min);
    }

    min_y = args.min_y ? args.min_y : min_y;
    max_y = args.max_y ? args.max_y : max_y;

    //todo get ymax from all lines if multiple lines, currently getting it from first line
    args.scales.Y = d3.scale.linear()
        .domain([0, max_y * args.inflator])
        .range([args.height - args.bottom - args.buffer, args.top]);
    
    var yax_format;
    if (args.format == 'count') {
        yax_format = function(f) {
            var pf = d3.formatPrefix(f);
            return args.yax_units + pf.scale(f) + pf.symbol;
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
        .classed('y-axis', true)
        .classed('y-axis-small', args.use_small_class);
;

    var last_i = args.scales.Y.ticks(args.yax_count).length-1;

    g.append('line')
        .attr('x1', args.left)
        .attr('x2', args.left)
        .attr('y1', args.scales.Y(args.scales.Y.ticks(args.yax_count)[0]))
        .attr('y2', args.scales.Y(args.scales.Y.ticks(args.yax_count)[last_i]));
    
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

function init(args) {
    //do we need to turn json data to 2d array?
    if(!$.isArray(args.data[0]))
        args.data = [args.data];

    //sort x-axis
        for(var i=0; i<args.data.length; i++) {
            args.data[i].sort(function(a, b) {
                return a[args.x_accessor] - b[args.x_accessor];
            });
        }
        
    //do we have a time_series?
    if($.type(args.data[0][0][args.x_accessor]) == 'date') {
        args.time_series = true;
    }
    else {
        args.time_series = false;
    }
    
    var linked;

    chart_title(args);

    d3.select(args.target)
        .append('svg')
            .classed('linked', args.linked)
            .attr('width', args.width)
            .attr('height', args.height);
    
    //we kind of need axes in all cases

    args.use_small_class = args.height - args.top - args.bottom - args.buffer <= args.small_height_threshold && 
            args.width - args.left-args.right - args.buffer*2 <= args.small_width_threshold ||
            args.small_text;
    
    xAxis(args);
    yAxis(args);
    
    return this;
}

function markers(args) {
        var svg = d3.select(args.target + ' svg');
        var gm;
        var gb;
        
        if(args.markers) {
            gm = svg.append('g')
                .attr('class', 'markers');
            
            gm.selectAll('.markers')
                .data(args.markers)
                .enter().append('line')
                    .attr('x1', function(d) {
                        return args.scales.X(d[args.x_accessor])
                    })
                    .attr('x2', function(d) {
                        return args.scales.X(d[args.x_accessor])
                    })
                    .attr('y1', args.top)
                    .attr('y2', function() {
                        return args.height - args.bottom - args.buffer;
                    })
                    .attr('stroke-dasharray', '3,1');
                
            gm.selectAll('.markers')
                .data(args.markers)
                .enter().append('text')
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
            gb = svg.append('g')
                .attr('class', 'baselines');

            gb.selectAll('.baselines')
                .data(args.baselines)
                .enter().append('line')
                    .attr('x1', args.left + args.buffer)
                    .attr('x2', args.width-args.right-args.buffer)
                    .attr('y1', function(d){
                        return args.scales.Y(d['value'])})
                    .attr('y2', function(d){return args.scales.Y(d['value'])});
                
            gb.selectAll('.baselines')
                .data(args.baselines)
                .enter().append('text')
                    .attr('x', args.width-args.right - args.buffer)
                    .attr('y', function(d){return args.scales.Y(d['value'])})
                    .attr('dy', -3)
                    .attr('text-anchor', 'end')
                    .text(function(d) {
                        return d['label'];
                    });
        }
        
        return this;
    }
    
charts.line = function(args) {
    this.args = args;

    this.init = function(args) {
        init(args);
        return this;
    }
    
    this.mainPlot = function() {
        var svg = d3.select(args.target + ' svg');
        var g;
          
        // main area
        var area = d3.svg.area()
            .x(args.scalefns.xf)
            .y0(args.scales.Y(0))
            .y1(args.scalefns.yf)
            .interpolate('cardinal');
    
        // main line
        var line = d3.svg.line()
            .x(args.scalefns.xf)
            .y(args.scalefns.yf)
            .interpolate('cardinal');
        
        for(var i=args.data.length-1; i>=0; i--) {
            if (args.area) {
                svg.append('path')
                    .attr('class', 'main-area ' + 'area' + (i+1) + '-color')
                    .attr('d', area(args.data[i]));
            }

            svg.append('path')
                .attr('class', 'main-line ' + 'line' + (i+1) + '-color')
                .attr('d', line(args.data[i]));
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
        
        //append circle
        svg.append('circle')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', 0);

        //main rollover, only for first line at the moment for multi-line charts, todo
        g = svg.append('g')
            .attr('class', 'transparent-rollover-rect');
        
        g.selectAll('.rollover-rects')
            .data(args.data[0]).enter()
                .append('rect')
                    .attr('class', function(d){
                        if(args.linked) {
                            var v = d[args.x_accessor];
                            var formatter = d3.time.format('%Y-%m-%d');
                            return 'roll_' + formatter(v);
                        }
                    })
                    .attr('x', function(d, i) {
                        var current_x = d;
                        var x_coord;
                    
                        if (i == 0) {
                            var next_x = args.data[0][1]; //todo
                            x_coord = args.scalefns.xf(current_x) 
                                - (args.scalefns.xf(next_x) - args.scalefns.xf(current_x))
                                / 2;
                        }
                        else {
                            var width = args.scalefns.xf(args.data[0][1])
                                - args.scalefns.xf(args.data[0][0]); //todo
                            
                            x_coord = args.scalefns.xf(current_x) - width / 2;
                        }
                        
                        return x_coord;    
                    })
                    .attr('y', args.top)
                    .attr('width', function(d, i) {
                        if (i != args.data[0].length - 1) { //todo
                            return args.scalefns.xf(args.data[0][i + 1]) 
                                - args.scalefns.xf(d); //todo
                        }
                        else {
                            return args.scalefns.xf(args.data[0][1]) //todo
                                - args.scalefns.xf(args.data[0][0]); //todo
                        }
                    })
                    .attr('height', args.height - args.bottom - args.top - args.buffer)
                    .attr('opacity', 0)
                    .on('mouseover', this.rolloverOn(args))
                    .on('mouseout', this.rolloverOff(args));
        
        return this;
    }
    
    this.rolloverOn = function(args) {
        var svg = d3.select(args.target + ' svg');
        var x_formatter = d3.time.format('%Y-%m-%d');

        return function(d, i) {
            svg.selectAll('circle')
                .attr('cx', function() {
                    return args.scales.X(d[args.x_accessor]);
                })
                .attr('cy', function() {
                    return args.scales.Y(d[args.y_accessor]);
                })
                .attr('r', 2.5)
                .style('opacity', 1);
     
            if(args.linked) {    
                var v = d[args.x_accessor];
                var formatter = d3.time.format('%Y-%m-%d');
            
                d3.selectAll('.transparent-rollover-rect rect')
                    .attr('opacity', 0);
                
                d3.selectAll('.roll_' + formatter(v))
                    .attr('opacity', 0.2)
            }    
            
            svg.selectAll('text')
                .filter(function(g, j) {
                    return d == g;
                })
                .attr('opacity', 0.3);
        
            var fmt = d3.time.format('%b %e, %Y');
        
            if (args.format == 'count') {
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

            svg.append('text')
                .classed('goals_rollover_text', true)
                .attr('xml:space', 'preserve')
                .attr('x', args.width - args.right)
                .attr('y', args.top / 2)
                .attr('text-anchor', 'end')
                .text(function() {
                    if(args.time_series) {
                        var dd = new Date(+d[args.x_accessor]);
                        dd.setDate(dd.getDate());
                        
                        return fmt(dd) + '  ' + num(d[args.y_accessor]);
                    }
                    else {
                        return args.x_accessor + ': ' + num(d[args.x_accessor]) 
                        + ', ' + args.y_accessor + ': ' + num(d[args.y_accessor]);
                    }
                });
        }
    }
    
    this.rolloverOff = function(args) {
        var svg = d3.select(args.target + ' svg');

        return function(d, i) {
            svg.selectAll('circle')
                .style('opacity', 0);
                
            d3.selectAll('.transparent-rollover-rect rect')
                .attr('opacity', 0);
            
            svg.select('.goals_rollover_text')
                .remove();
        }
    }
    
    this.init(args);
    return this;
}

charts.missing = function(args) {
    this.args = args;

    this.init = function(args) {
        chart_title(args);

        var svg = d3.select(args.target)
            .append('svg')
                .attr('width', args.width)
                .attr('height', args.height);
                
        svg.append('rect')
            .attr('class', 'missing-pane')
            .attr('x', args.left)
            .attr('y', args.top)
            .attr('width', args.width - (args.left * 2))
            .attr('height', args.height - (args.top * 2));
            
        svg.append('text')
            .attr('x', args.width / 2)
            .attr('y', args.height / 2)
            .attr('dy', '.50em')
            .attr('text-anchor', 'middle')
            .text(function(d) {
                return 'Data currently missing or unavailable';
            })
        
        return this;
    }
    
    this.init(args);
    return this;
}
