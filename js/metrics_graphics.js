var moz = {};

moz.defaults = {};

moz.defaults.all = {
	scales: {},
	scalefns: {},
	title: null,
	width:    350,
	height:   220,
	data:     [],
	left:     50,
	right:    10,
	first: false,
	x_accessor:'date',
	y_accessor:'value',
	y_max_accessor:'value',
	list:     false,
	goal:     null,
	top:      40,
	bottom:   30,
	xax_tick: 5,
	min_x: null,
	min_y: null,
	xax_count:8,
	yax_tick: 5,
	yax_count:4,
	axis_opacity:1,
	decimal:false,
	xax_date_format: function(d){
		var df = d3.time.format('%m/%d');
		return df(d);
	},
	buffer:8,
	type: 'count',
	target: 'div#viz'
}

var GRAPHS = {};
var app = {};
app.current_version = 28;
app.sample_multiplier = 100;
app.max_data_length = 0;

//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////

function strip_punctuation(s){
	var punctuationless = s.replace(/[^a-zA-Z0-9 ]+/g, '');
	var finalString = 'chart_' + punctuationless.replace(/ +?/g, "");
	return finalString;
}

function perc(p){
		return d3.round(p*100, 1) + '%';
}

var percentage_comp = function(val, yes, neutral, no){
	val = Math.round(val * 100) / 100;
	return val > 0 ? yes : (val == 0 ? neutral : no);
}

function percentage_change(first, last){
	return (last-first) / last;
}

function version_to_int(v){
	return parseInt(parseFloat(v));
}

function which_version(date){
	var version = _.filter(app.versions, function(d){
		return date >= d['date'] && date <= d['end'];
		//date > d
	})[0];
	return version;
}

function add_date_x(args){
	var min_x = args.min_x ? args.min_x :      args.data[0][args.x_accessor];
	var max_x = args.max_x ? args.max_x : _.last(args.data)[args.x_accessor];

	args.scales.X = d3.time.scale()
		.domain([min_x, max_x])
		.range([args.left + args.buffer, args.width - args.right]);

	return args;
}

function add_value_y(args){
	args.scales.Y = d3.scale.linear()
		.domain([0, 
			Math.max(
			d3.max(args.data, 
				function(d){return d[args.y_accessor]}) *10/9,
			args.goal * 10/9)
			])
		.range([args.height-args.bottom - args.buffer, args.top]);
	return args;
}

function add_line_scalefns(args){

}

function moz_chart(){
	var args = arguments[0];
	if (!args) {
		args = {};
	};
	args = _.defaults(args, moz.defaults.all);

	if (args.list){
		args.x_accessor = 0;
		args.y_accessor = 1;
	}

	var svg = d3.select(args.target).append('svg:svg')
		.attr('width', args.width)
		.attr('height', args.height);

	//
	// Determine the x bounds, given the data, or go with specified range.
	//

	add_date_x(args);
	add_value_y(args);

	var versions_in_range = app.versions;


	args.scalefns.xf = function(di){
		return args.scales.X(di[args.x_accessor]);
	};

	args.scalefns.yf = function(di){
		return args.scales.Y(di[args.y_accessor]);
	};

	var num = d3.format("0,000");

	if (args.title){
		svg.append('svg:text')
		.text(args.title)
		.attr('text-transform', 'upper')
		.attr('x', args.left)
		.attr('y', args.top/2);
	}

	if (args.goal){
		svg.append('svg:line')
			.attr('x1', args.left)
			.attr('x2', args.width-args.right)
			.attr('y1', args.scales.Y(args.goal))
			.attr('y2', args.scales.Y(args.goal))
			.attr('stroke', 'blue')
			.attr('stroke-width', 1)
			.attr('stroke-dasharray', '5,1')
			.attr('opacity', .5);

		if (true){
			svg.append('svg:text')
				.attr('x', args.width-args.right)
				.attr('y', args.scales.Y(args.goal))
				.attr('text-anchor', 'end')
				.attr('font-weight', 'bold')
				.attr('font-size', 8)
				.attr('fill', 'blue')
				.attr('opacity', .3)
				.attr('dy', '1.1em')
				.text("Dec. 2014 Goal");
			//
			svg.append('svg:text')
				.attr('x', args.width-args.right)
				.attr('y', args.scales.Y(args.goal))
				.attr('text-anchor', 'end')
				.attr('font-weight', 'bold')
				.attr('font-size', 8)
				.attr('fill', 'blue')
				.attr('opacity', .3)
				.attr('dy', '-.35em')
				.text(num(d3.round(args.goal)));
		}
	};

	var line = d3.svg.line()
		.x(args.scalefns.xf)
		.y(args.scalefns.yf)
		.interpolate('cardinal');

	var area = d3.svg.area()
		.x(args.scalefns.xf)
		.y0(args.scales.Y(0))
		.y1(args.scalefns.yf)
		.interpolate('cardinal');
	//

	// main area
	svg.append('svg:path')
		.attr('d', area(args.data))
		.attr('fill', 'blue')
		.attr('opacity', .3)
		.attr('stroke', 'none');

	// main line
	svg.append('svg:path')
		.attr('d', line(args.data))
		.attr('fill', 'none')
		.attr('stroke', 'black');

	// alt
	svg.selectAll('.dates').data(app.versions).enter().append('svg:line')
		.attr('x1', function(d){return args.scales.X(d['date'])})
		.attr('x2', function(d){return args.scales.X(d['date'])})
		.attr('y1', args.top)
		.attr('y2', args.height - args.bottom - args.buffer)
		.attr('opacity', .2)
		.attr('stroke-dasharray', '3,1')
		.attr('stroke','black');

	svg.selectAll('.dates').data(app.versions).enter().append('svg:text')
		.attr('x', function(d){return args.scales.X(d['date'])})
		.attr('y', args.top-8)
		.attr('text-anchor', 'middle')
		.attr('opacity', .2)
		.attr('font-size', 8)
		.attr('font-weight', 300)
		.text(function(d){return d['version']})
		.attr('fill', 'black')
		.attr('stroke','black');

	var years = d3.time.years(
		d3.min(args.data, function(d){return d[args.x_accessor]}), 
		d3.max(args.data, function(d){return d[args.x_accessor]})
	);

	svg.selectAll('.year_marker').data(years).enter().append('svg:line')
		.attr('x1', args.scales.X)
		.attr('x2', args.scales.X)
		.attr('y1', args.top)
		.attr('y2', args.height-args.bottom)
		.attr('fill', 'black')
		.attr('stroke', 'black')
		.attr('opacity', .3);
	
	var yformat = d3.time.format('%Y');

	svg.selectAll('.year_marker').data(years).enter().append('svg:text')
		.attr('x', args.scales.X)
		.attr('y', args.height-args.bottom + 26)
		.attr('text-anchor', 'middle')
		.attr('font-size', 8)
		.attr('opacity', .5)
		.attr('font-weight', 'bold')
		.text(function(d){return yformat(d)})
		.attr('fill', 'black');

	svg.selectAll('.point_marker').data(args.data).enter().append('svg:circle')
		.classed('adi_background', true)
		.classed('last_point', function(d,i){
			return i == args.data.length-1;
		})
		.attr('cx', args.scalefns.xf)
		.attr('cy', args.scalefns.yf)
		.attr('r', 2.5)
		.attr('opacity', function(d,i){
			if (i == args.data.length-1){
				return .85;
			} else {
				return 0;
			}
		})
		.attr('fill', 'black');

	var yax_format;
	if (args.type == 'count'){
		 yax_format = function(f){
			var pf = d3.formatPrefix(f);
			return pf.scale(f) + pf.symbol;
		};		
	} else {
		yax_format = function(d_){
			var n = d3.format('%p');
			return n(d_);
		}
	};

	////////                  X AXIS                    //////////
	////////                  X AXIS                    //////////
	////////                  X AXIS                    //////////

	svg.append('svg:line')
		.attr('x1', args.scales.X(_.last(args.scales.X.ticks(args.xax_count))))
		.attr('x2', args.scales.X(_.first(args.scales.X.ticks(args.xax_count))))
		.attr('y1', args.height - args.bottom)
		.attr('y2', args.height - args.bottom)
		.attr('opacity', args.axis_opacity)
		.attr('stroke', 'black');

	svg.selectAll('.xax-ticks').data(args.scales.X.ticks(args.xax_count)).enter().append('svg:line')
			.attr('x1', args.scales.X)
			.attr('x2', args.scales.X)
			.attr('y1', args.height - args.bottom)
			.attr('y2', args.height - args.bottom + args.xax_tick)
			.attr('opacity', args.axis_opacity)
			.attr('stroke', 'black');

	var month = d3.time.format('%b');

	svg.selectAll('.xax-labels').data(args.scales.X.ticks(args.xax_count)).enter().append('svg:text')
			.attr('x', args.scales.X)
			.attr('y', args.height - args.bottom + args.xax_tick * 7/3)
			.attr('text-anchor', 'middle')
			.attr('dy', '.50em')
			.attr('font-size', 10)
			.attr('text-transform', 'uppercase')
			.attr('font-weight', 300)
			.attr('opacity', .5)
			.attr('fill', 'black')
			.text(function(d){return args.xax_date_format(d)});



	////////                  Y AXIS                    //////////
	////////                  Y AXIS                    //////////
	////////                  Y AXIS                    //////////
	if (true){
		
		svg.append('svg:line')
			.attr('x1', args.left)
			.attr('x2', args.left)
			.attr('y1', args.scales.Y(_.first(args.scales.Y.ticks(args.yax_count))))
			.attr('y2', args.scales.Y(_.last(args.scales.Y.ticks(args.yax_count))))
			.attr('stroke', 'black')
			.attr('opacity', args.axis_opacity);

		svg.selectAll('.yax-ticks').data(args.scales.Y.ticks(args.yax_count)).enter().append('svg:line')
			.attr('x1', args.left)
			.attr('x2', args.left - args.yax_tick)
			.attr('y1', args.scales.Y)
			.attr('y2', args.scales.Y)
			.attr('stroke', 'black')
			.attr('opacity', args.axis_opacity);

		svg.selectAll('.yax-labels').data(args.scales.Y.ticks(args.yax_count)).enter().append('svg:text')
			.attr('x', args.left - args.yax_tick*3/2)
			.attr('dx', -3)
			.attr('y', args.scales.Y)
			.attr('dy', '.35em')
			.attr('font-size', 10)
			.attr('font-weight', 300)
			.attr('text-anchor', 'end')
			.attr('fill', 'black')
			.attr('opacity', .4)
			.text(function(d,i){
				var o = yax_format(d);
				return o;
		})		
	}

	/////////////                                                   /////////////
	/////////////                Main Rollover Element              /////////////
	/////////////                                                   /////////////
	svg.selectAll('.periods').data(args.data).enter().append('svg:rect')
		.classed('adi_rollover', true)
		.attr('x', function(d,i){
				var current_date = d;
				var next_date, previous_date;
				var x_coord;
				//console.log(current_date, i);
				if (i == 0){
					next_date = args.data[1];
					x_coord = args.scalefns.xf(current_date) - (args.scalefns.xf(next_date) - args.scalefns.xf(current_date))/2;
				} else {
					previous_date = args.data[i-1];
					x_coord = args.scalefns.xf(current_date) - (args.scalefns.xf(current_date) - args.scalefns.xf(previous_date) )/2;
				}
				return x_coord;
		})
		.attr('y', args.top)
		.attr('width', function(d,i){
			if (i != args.data.length-1){
				return args.scalefns.xf( args.data[i+1] ) - args.scalefns.xf(d);	
			} else {
				return args.scalefns.xf(args.data[1])- args.scalefns.xf(args.data[0]);
			}
		})
		.attr('height', args.height-args.bottom)
		.attr('font-size', 10)
		.attr('font-weight', 300)
		.attr('fill', 'black')
		.attr('opacity', 0)
		.attr('stroke', 'black')//.text(function(d){return d['version']})
		.attr('stroke','black')
		.on('mouseover', goal_over(svg, args))
		.on('mouseout', goal_out(svg, args));
};

function goal_over(svg, args){
	return function(d,i){

		d3.selectAll('circle.adi_background')
			.attr('opacity', 0)
			.filter(function(g,j){return d == g})
				.attr('opacity', .85);

		svg.selectAll('text.adi_rollover')
			.filter(function(g,j){return d == g})
			.attr('opacity', .3);

		var fmt = d3.time.format('%x');
		if (args.type=='count'){
				var num = function(d_){
					var _;
					var n = d3.format("0,000");
					d_ = args.decimal ? d3.round(d_,2) : d3.round(d_);
					return n(d_);
				}
		}
		else {
			var num = function(d_){
				var n = d3.format('%');
				return n(d_);
			}
		}
		var dd = new Date(+d[args.x_accessor]);
		dd.setDate(dd.getDate()+1);
		svg.append('svg:text')
			.classed('goals_rollover_text', true)
			.attr('xml:space', 'preserve')
			.attr('x', args.width-args.right)
			.attr('y', args.top/2)
			.attr('font-size', 12)
			.attr('text-anchor', 'end')
			.attr('fill', 'black')
			.attr('font-weight', 300)
			.text(fmt(dd) + '     ' + num(d[args.y_accessor]));
	}
};

// nohup make ARGS="scripts/downloads_daily.py outData/2014-04-01.csv /data/weblogs/v2_raw/download-stats.mozilla.org/2014-04-01" hadoop &

function goal_out(svg, args){
	return function(d,i){
		svg.selectAll('text.adi_averages')
			.attr('opacity', 0);
		svg.selectAll('line.adi_average')
			.attr('opacity', 0);
		svg.selectAll('circle.adi_background')
			.attr('opacity', 0);
		svg.selectAll('text.adi_rollover')
			.attr('opacity', 0);
		svg.select('text.goals_rollover_text').remove();
		d3.selectAll('circle.last_point').attr('opacity', .85);
	}
};