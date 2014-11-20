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

	this.target = function(){
		var target = arguments[0];
		this.args.target = target;
		return this;
	}

	this.title = function(){
		var args = merge_with_defaults(clone(arguments[0]), clone(this.args.standard_col));
		args.type='title';
		this.args.columns.push(args);
		return this;
	}
	this.text = function(){
		var args = merge_with_defaults(clone(arguments[0]), clone(this.args.standard_col));
		args.type='text';
		this.args.columns.push(args);
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
		var args = merge_with_defaults(clone(arguments[0]), clone(this.args.standard_col));
		args.type='number';
		this.args.columns.push(args);
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
				td_accessor = args.columns[j].accessor;
				td_text = args.data[i][td_accessor];
				td_type     = args.columns[j].type;
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



