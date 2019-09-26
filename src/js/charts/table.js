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

MG.data_table = function(args) {
  'use strict';
  this.args = args;
  this.args.standard_col = { width: 150, font_size: 12, font_weight: 'normal' };
  this.args.columns = [];
  this.formatting_options = [
    ['color', 'color'],
    ['font-weight', 'font_weight'],
    ['font-style', 'font_style'],
    ['font-size', 'font_size']
  ];

  this._strip_punctuation = function(s) {
    var punctuationless = s.replace(/[^a-zA-Z0-9 _]+/g, '');
    var finalString = punctuationless.replace(/ +?/g, '');
    return finalString;
  };

  this._format_element = function(element, value, args) {
    this.formatting_options.forEach(function(fo) {
      var attr = fo[0];
      var key = fo[1];
      if (args[key]) element.style(attr,
        typeof args[key] === 'string' ||
        typeof args[key] === 'number' ?
        args[key] : args[key](value));
    });
  };

  this._add_column = function(_args, arg_type) {
    var standard_column = this.args.standard_col;
    var args = merge_with_defaults(MG.clone(_args), MG.clone(standard_column));
    args.type = arg_type;
    this.args.columns.push(args);
  };

  this.target = function() {
    var target = arguments[0];
    this.args.target = target;
    return this;
  };

  this.title = function() {
    this._add_column(arguments[0], 'title');
    return this;
  };

  this.text = function() {
    this._add_column(arguments[0], 'text');
    return this;
  };

  this.bullet = function() {
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
  };

  this.sparkline = function() {
    return this;
  };

  this.number = function() {
    this._add_column(arguments[0], 'number');
    return this;
  };

  this.display = function() {
    var args = this.args;

    chart_title(args);

    var target = args.target;
    var table = d3.select(target).append('table').classed('mg-data-table', true);
    var colgroup = table.append('colgroup');
    var thead = table.append('thead');
    var tbody = table.append('tbody');
    var this_column;
    var this_title;

    var tr, th, td_accessor, td_type, td_value, th_text, td_text, td;
    var col;
    var h;

    tr = thead.append('tr');

    for (h = 0; h < args.columns.length; h++) {
      var this_col = args.columns[h];
      td_type = this_col.type;
      th_text = this_col.label;
      th_text = th_text === undefined ? '' : th_text;
      th = tr.append('th')
        .style('width', this_col.width)
        .style('text-align', td_type === 'title' ? 'left' : 'right')
        .text(th_text);

      if (args.show_tooltips && this_col.description && mg_jquery_exists()) {
        th.append('i')
          .classed('fa', true)
          .classed('fa-question-circle', true)
          .classed('fa-inverse', true);

        $(th.node()).popover({
          html: true,
          animation: false,
          content: this_col.description,
          trigger: 'hover',
          placement: 'top',
          container: $(th.node())
        });
      }
    }

    for (h = 0; h < args.columns.length; h++) {
      col = colgroup.append('col');
      if (args.columns[h].type === 'number') {
        col.attr('align', 'char').attr('char', '.');
      }
    }

    for (var i = 0; i < args.data.length; i++) {
      tr = tbody.append('tr');
      for (var j = 0; j < args.columns.length; j++) {
        this_column = args.columns[j];
        td_accessor = this_column.accessor;
        td_value = td_text = args.data[i][td_accessor];
        td_type = this_column.type;

        if (td_type === 'number') {
          //td_text may need to be rounded
          if (this_column.hasOwnProperty('round') && !this_column.hasOwnProperty('format')) {
            // round according to the number value in this_column.round
            td_text = d3.format('0,.' + this_column.round + 'f')(td_text);
          }

          if (this_column.hasOwnProperty('value_formatter')) {
            // provide a function that formats the text according to the function this_column.format.
            td_text = this_column.value_formatter(td_text);
          }

          if (this_column.hasOwnProperty('format')) {
            // this is a shorthand for percentage formatting, and others if need be.
            // supported: 'percentage', 'count', 'temperature'

            if (this_column.round) {
              td_text = Math.round(td_text, this_column.round);
            }

            var this_format = this_column.format;
            var formatter;

            if (this_format === 'percentage') formatter = d3.format('.0%');
            if (this_format === 'count') formatter = d3.format(',.0f');
            if (this_format === 'temperature') formatter = function(t) {
              return t + '°'; };

            td_text = formatter(td_text);
          }

          if (this_column.hasOwnProperty('currency')) {
            // this is another shorthand for formatting according to a currency amount, which gets appended to front of number
            td_text = this_column.currency + td_text;
          }
        }

        td = tr.append('td')
          .classed('table-' + td_type, true)
          .classed('table-' + td_type + '-' + this._strip_punctuation(td_accessor), true)
          .attr('data-value', td_value)
          .style('width', this_column.width)
          .style('text-align', td_type === 'title' || td_type === 'text' ? 'left' : 'right');

        this._format_element(td, td_value, this_column);

        if (td_type === 'title') {
          this_title = td.append('div').text(td_text);
          this._format_element(this_title, td_text, this_column);

          if (args.columns[j].hasOwnProperty('secondary_accessor')) {
            td.append('div')
              .text(args.data[i][args.columns[j].secondary_accessor])
              .classed("secondary-title", true);
          }
        } else {
          td.text(td_text);
        }
      }
    }

    return this;
  };

  return this;
};
