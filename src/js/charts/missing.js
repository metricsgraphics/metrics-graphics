(function() {
  'use strict';

  function mg_missing_add_text(svg, args) {
    svg.selectAll('.mg-missing-text').data([args.missing_text])
      .enter().append('text')
      .attr('class', 'mg-missing-text')
      .attr('x', args.width / 2)
      .attr('y', args.height / 2)
      .attr('dy', '.50em')
      .attr('text-anchor', 'middle')
      .text(args.missing_text);
  }

  function mg_missing_x_scale(args) {
    args.scales.X = d3.scaleLinear()
      .domain([0, args.data.length])
      .range([mg_get_plot_left(args), mg_get_plot_right(args)]);
    args.scalefns.yf = function(di) {
      return args.scales.Y(di.y); };
  }

  function mg_missing_y_scale(args) {
    args.scales.Y = d3.scaleLinear()
      .domain([-2, 2])
      .range([args.height - args.bottom - args.buffer * 2, args.top]);
    args.scalefns.xf = function(di) {
      return args.scales.X(di.x); };
  }

  function mg_make_fake_data(args) {
    var data = [];
    for (var x = 1; x <= 50; x++) {
      data.push({ 'x': x, 'y': Math.random() - (x * 0.03) });
    }
    args.data = data;
  }

  function mg_add_missing_background_rect(g, args) {
    g.append('svg:rect')
      .classed('mg-missing-background', true)
      .attr('x', args.buffer)
      .attr('y', args.buffer + args.title_y_position * 2)
      .attr('width', args.width - args.buffer * 2)
      .attr('height', args.height - args.buffer * 2 - args.title_y_position * 2)
      .attr('rx', 15)
      .attr('ry', 15);
  }

  function mg_missing_add_line(g, args) {
    var line = d3.line()
      .x(args.scalefns.xf)
      .y(args.scalefns.yf)
      .curve(args.interpolate);

    g.append('path')
      .attr('class', 'mg-main-line mg-line1-color')
      .attr('d', line(args.data));
  }

  function mg_missing_add_area(g, args) {
    var area = d3.area()
      .x(args.scalefns.xf)
      .y0(args.scales.Y.range()[0])
      .y1(args.scalefns.yf)
      .curve(args.interpolate);

    g.append('path')
      .attr('class', 'mg-main-area mg-area1-color')
      .attr('d', area(args.data));
  }

  function mg_remove_all_children(args) {
    d3.select(args.target).selectAll('svg *').remove();
  }

  function mg_missing_remove_legend(args) {
    if (args.legend_target) {
      d3.select(args.legend_target).html('');
    }
  }

  function missingData(args) {
    this.init = function(args) {
      this.args = args;

      mg_init_compute_width(args);
      mg_init_compute_height(args);

      // create svg if one doesn't exist

      var container = d3.select(args.target);
      mg_raise_container_error(container, args);
      var svg = container.selectAll('svg');
      mg_remove_svg_if_chart_type_has_changed(svg, args);
      svg = mg_add_svg_if_it_doesnt_exist(svg, args);
      mg_adjust_width_and_height_if_changed(svg, args);
      mg_set_viewbox_for_scaling(svg, args);
      mg_remove_all_children(args);

      svg.classed('mg-missing', true);
      mg_missing_remove_legend(args);

      chart_title(args);

      // are we adding a background placeholder
      if (args.show_missing_background) {
        mg_make_fake_data(args);
        mg_missing_x_scale(args);
        mg_missing_y_scale(args);
        var g = mg_add_g(svg, 'mg-missing-pane');

        mg_add_missing_background_rect(g, args);
        mg_missing_add_line(g, args);
        mg_missing_add_area(g, args);
      }

      mg_missing_add_text(svg, args);

      this.windowListeners();

      return this;
    };

    this.windowListeners = function() {
      mg_window_listeners(this.args);
      return this;
    };

    this.init(args);
  }

  var defaults = {
    top: 40, // the size of the top margin
    bottom: 30, // the size of the bottom margin
    right: 10, // size of the right margin
    left: 0, // size of the left margin
    buffer: 8, // the buffer between the actual chart area and the margins
    legend_target: '',
    width: 350,
    height: 220,
    missing_text: 'Data currently missing or unavailable',
    scalefns: {},
    scales: {},
    show_tooltips: true,
    show_missing_background: true
  };

  MG.register('missing-data', missingData, defaults);
}).call(this);
