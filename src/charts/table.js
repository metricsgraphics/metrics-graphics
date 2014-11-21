/*
Data Tables

Along with histograms, bars, lines, and scatters, a simple data table can take you far.
We often just want to look at numbers, organized as a table, where columns are variables,
and rows are data points. Sometimes we want a cell to have a small graphic as the main
column element, in which case we want small multiples. sometimes we want to 

var table = New data_table(data)
				.target('div#data-table')
				.title({accessor: 'point_name', align: 'left'})
				.description({accessor: 'description'})
				.number({accessor: ''})

*/

function data_table(args){
	'use strict';
	this.args = args;
	this.args.standard_col = {width:150, font_size:12};
	this.args.columns = [];

	this._add_column = function(_args, arg_type){
		var standard_column = this.args.standard_col;
		var args = merge_with_defaults(clone(_args), clone(standard_column));
		args.type=arg_type;
		this.args.columns.push(args);
	}

	this.target = function(){
		var target = arguments[0];
		this.args.target = target;
		return this;
	}

	this.title = function(){
		this._add_column(arguments[0], 'title');
		return this;
	}
	this.text = function(){
		this._add_column(arguments[0], 'text');
		return this;
	}
	this.bullet = function(){
		/*
		text label 
		main value
		comparative measure
		any number of ranges

		additional args:
		no title
		xmin, xmax
		format: percentage
		xax_formatter
		*/
		return this;
	}
	this.sparkline = function(){

		return this;
	}
	this.number = function(){
		this._add_column(arguments[0], 'number');
		return this;
	}

	this.display = function(){
		var this_column;
		var args = this.args;

		chart_title(args);

		var target = args.target;
		var table = d3.select(target).append('table').classed('data-table', true);
		var colgroup = table.append('colgroup');
		var thead = table.append('thead').classed('data-table-thead', true);
		var tbody = table.append('tbody');

		var this_column;
		var tr, th, td_accessor, td_type, th_text, td_text, td;
		var col;

		tr = thead.append('tr').classed('header-row', true);
		for (var h=0;h<args.columns.length;h++){
			var this_col = args.columns[h];
			td_type = this_col.type;
			th_text=this_col.label;
			th_text =th_text == undefined ? '' : th_text;
			tr.append('th')
				.classed('data-table-th', true)
				.style('width', this_col.width)
				.style('text-align', td_type=='title' ? 'left' : 'right')
				.text(th_text);
		}

		for (var h=0;h<args.columns.length;h++){
			col = colgroup.append('col');
			if (args.columns[h].type=='number'){
				col.attr('align', 'char').attr('char', '.');
			}
		}

		for (var i=0;i<args.data.length;i++){
			tr = tbody.append('tr');
			for (var j=0;j<args.columns.length;j++){
				this_column = args.columns[j];
				td_accessor = this_column.accessor;
				td_text = args.data[i][td_accessor];
				td_type     = this_column.type;

				if (td_type=='number'){
					//td_text may need to be rounded.
					if (this_column.hasOwnProperty('round') && !this_column.hasOwnProperty('format')){
						// round according to the number value in this_column.round.
						//td_text = d3.round(td_text, this_column.round);
						td_text = d3.format('0,.'+this_column.round+'f')(td_text);
					}
					if (this_column.hasOwnProperty('value_formatter')){
						// provide a function that formats the text according to the function this_column.format.
						td_text = this_column.value_formatter(td_text);

					} if (this_column.hasOwnProperty('format')){
						// this is a shorthand for percentage formatting, and others if need be.
						// supported: 'percentage', 'count', 'temperature'
						
						if (this_column.round) td_text = d3.round(td_text, this_column.round);
						var this_format = this_column.format;
						var formatter;

						if (this_format=='percentage')  formatter = d3.format('%p');
						if (this_format=='count')       formatter = d3.format("0,000");
						if (this_format=='temperature') formatter = function(t){return t +'º'};
						
						td_text = formatter(td_text);

					} if (this_column.hasOwnProperty('currency')){
						// this is another shorthand for formatting according to a currency amount, which gets appended to front of number.
						td_text = this_column.currency + td_text;
					}
				}

				td = tr.append('td')
					.classed('data-table', true)
					.classed('table-number', td_type=='number')
					.classed('table-title',  td_type=='type')
					.classed('table-text',   td_type=='text')
					.style('width', args.columns[j].width)
					.style('font-size', args.columns[j].font_size)
					.style('text-align', td_type=='title' || td_type=='text' ? 'left' : 'right');

				if (td_type=='title'){
					td.append('div').text(td_text);
					if (args.columns[j].hasOwnProperty('secondary_accessor')){
						td.append('div')
							.text(args.data[i][args.columns[j].secondary_accessor])
							.classed("secondary-title", true)
					}
				} else {
					td.text(td_text);
				}
			}
		}
		return this;
	}

	return this;
}



