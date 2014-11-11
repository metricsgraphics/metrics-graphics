/*
Data Tables

Along with histograms, bars, lines, and scatters, a simple data table can take you far.
We often just want to look at numbers, organized as a table, where columns are variables,
and rows are data points. Sometimes we want a cell to have a small graphic as the main
column element, in which case we want small multiples. sometimes we want to 


*/

function data_table(data){
	this.columns = {};

	this.data = function(){
		this._data = data;
		return this;
	}
	this.title = function(){
		/* 
		args:
		1 key upon which to pull data
		2 some formatting options in an object?
		*/
	}
	this.text = function(){
		/* 
		designed for longer form text - perhaps a few sentences describing something.
		*/
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
		/* 
		args:
		1 key upon which to pull data
		2 function to apply label, or perhaps a string to append
		*/
		return this;
	}

	this.display = function(){
		return this;
	}

	return this;
}