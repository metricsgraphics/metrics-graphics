{
  function mg_missing_add_text(svg, {missing_text, width, height}) {
    svg.selectAll('.mg-missing-text').data([missing_text])
      .enter().append('text')
      .attr('class', 'mg-missing-text')
      .attr('x', width / 2)
      .attr('y', height / 2)
      .attr('dy', '.50em')
      .attr('text-anchor', 'middle')
      .text(missing_text);
  }

  function mg_missing_x_scale(args) {
    args.scales.X = d3.scaleLinear()
      .domain([0, args.data.length])
      .range([mg_get_plot_left(args), mg_get_plot_right(args)]);
    args.scalefns.yf = ({y}) => args.scales.Y(y);
  }

  function mg_missing_y_scale(args) {
    args.scales.Y = d3.scaleLinear()
      .domain([-2, 2])
      .range([args.height - args.bottom - args.buffer * 2, args.top]);
    args.scalefns.xf = ({x}) => args.scales.X(x);
  }

  function mg_make_fake_data(args) {
    const data = [];
    for (let x = 1; x <= 50; x++) {
      data.push({ x, y: Math.random() - (x * 0.03) });
    }
    args.data = data;
  }

  function mg_add_missing_background_rect(g, {title, buffer, title_y_position, width, height}) {
    g.append('svg:rect')
      .classed('mg-missing-background', true)
      .attr('x', buffer)
      .attr('y', buffer + (title ? title_y_position : 0) * 2)
      .attr('width', width - buffer * 2)
      .attr('height', height - buffer * 2 - (title ? title_y_position : 0) * 2)
      .attr('rx', 15)
      .attr('ry', 15);
  }

  function mg_missing_add_line(g, {scalefns, interpolate, data}) {
    const line = d3.line()
      .x(scalefns.xf)
      .y(scalefns.yf)
      .curve(interpolate);

    g.append('path')
      .attr('class', 'mg-main-line mg-line1-color')
      .attr('d', line(data));
  }

  function mg_missing_add_area(g, {scalefns, scales, interpolate, data}) {
    const area = d3.area()
      .x(scalefns.xf)
      .y0(scales.Y.range()[0])
      .y1(scalefns.yf)
      .curve(interpolate);

    g.append('path')
      .attr('class', 'mg-main-area mg-area1-color')
      .attr('d', area(data));
  }

  function mg_remove_all_children({target}) {
    d3.select(target).selectAll('svg *').remove();
  }

  function mg_missing_remove_legend({legend_target}) {
    if (legend_target) {
      d3.select(legend_target).html('');
    }
  }

  function missingData(args) {
    this.init = (args) => {
      this.args = args;

      mg_init_compute_width(args);
      mg_init_compute_height(args);

      // create svg if one doesn't exist

      const container = d3.select(args.target);
      mg_raise_container_error(container, args);
      let svg = container.selectAll('svg');
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
        const g = mg_add_g(svg, 'mg-missing-pane');

        mg_add_missing_background_rect(g, args);
        mg_missing_add_line(g, args);
        mg_missing_add_area(g, args);
      }

      mg_missing_add_text(svg, args);

      this.windowListeners();

      return this;
    };

    this.windowListeners = () => {
      mg_window_listeners(this.args);
      return this;
    };

    this.init(args);
  }

  const defaults = {
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
}