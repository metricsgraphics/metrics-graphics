const deepmerge = require('deepmerge')

MG.globals = {}
MG.deprecations = {
  rollover_callback: { replacement: 'mouseover', version: '2.0' },
  rollout_callback: { replacement: 'mouseout', version: '2.0' },
  x_rollover_format: { replacement: 'xMouseover', version: '2.10' },
  y_rollover_format: { replacement: 'yMouseover', version: '2.10' },
  showYears: { replacement: 'showSecondaryXLabel', version: '2.1' },
  xax_start_at_min: { replacement: 'axesNotCompact', version: '2.7' },
  interpolate_tension: { replacement: 'interpolate', version: '2.10' }
}
MG.globals.link = false
MG.globals.version = '1.1'

MG.options = { // <name>: [<defaultValue>, <availableType>]
  xAxis_type: [null, ['categorical']], // TO BE INTRODUCED IN 2.10
  yAxis_type: [null, ['categorical']], // TO BE INTRODUCED IN 2.10
  y_padding_percentage: [0.05, 'number'], // for categorical scales
  y_outer_padding_percentage: [0.1, 'number'], // for categorical scales
  ygroup_padding_percentage: [0.25, 'number'], // for categorical scales
  ygroup_outer_padding_percentage: [0, 'number'], // for categorical scales
  x_padding_percentage: [0.05, 'number'], // for categorical scales
  x_outer_padding_percentage: [0.1, 'number'], // for categorical scales
  xgroup_padding_percentage: [0.25, 'number'], // for categorical scales
  xgroup_outer_padding_percentage: [0, 'number'], // for categorical scales
  yGroupAccessor: [null, 'string'],
  xgroup_accessor: [null, 'string'],
  yCategoricalShowGuides: [false, 'boolean'],
  x_categorical_show_guide: [false, 'boolean'],
  rotateXLabels: [0, 'number'],
  rotateYLabels: [0, 'number'],
  scales: [{}],
  scaleFunctions: [{}],
  // Data
  data: [[], ['object[]', 'number[]']], // the data object
  missingIsZero: [false, 'boolean'], // assume missing observations are zero
  missingIsHidden: [false, 'boolean'], // show missing observations as missing line segments
  missingIsHidden_accessor: [null, 'string'], // the accessor for identifying observations as missing
  utcTime: [false, 'boolean'], // determines whether to use a UTC or local time scale
  xAccessor: ['date', 'string'], // the data element that's the x-accessor
  xSort: [true, 'boolean'], // determines whether to sort the x-axis' values
  yAccessor: ['value', ['string', 'string[]']], // the data element that's the y-accessor
  // Axes
  axesNotCompact: [true, 'boolean'], // determines whether to draw compact or non-compact axes
  europeanClock: [false, 'boolean'], // determines whether to show labels using a 24-hour clock
  inflator: [10 / 9, 'number'], // a multiplier for inflating maxX and maxY
  maxX: [null, ['number', Date]], // the maximum x-value
  maxY: [null, ['number', Date]], // the maximum y-value
  minX: [null, ['number', Date]], // the minimum x-value
  minY: [null, ['number', Date]], // the minimum y-value
  minY_from_data: [false, 'boolean'], // starts y-axis at data's minimum value
  showYearMarkers: [false, 'boolean'], // determines whether to show year markers along the x-axis
  showSecondaryXLabel: [true, 'boolean'], // determines whether to show years along the x-axis
  small_text: [false, 'boolean'],
  xExtendedTicks: [false, 'boolean'], // determines whether to extend the x-axis ticks across the chart
  xAxis: [true, 'boolean'], // determines whether to display the x-axis
  xLabel: ['', 'string'], // the label to show below the x-axis
  xaxCount: [6, 'number'], // the number of x-axis ticks
  xaxFormat: [null, 'function'], // a function that formats the x-axis' labels
  xaxTickLength: [5, 'number'], // the x-axis' tick length in pixels
  xaxUnits: ['', 'string'], // a prefix symbol to be shown alongside the x-axis' labels
  x_scale_type: ['linear', 'log'], // the x-axis scale type
  yAxis: [true, 'boolean'], // determines whether to display the y-axis
  xAxis_position: ['bottom'], // string
  yAxis_position: ['left'], // string
  yExtendedTicks: [false, 'boolean'], // determines whether to extend the y-axis ticks across the chart
  yLabel: ['', 'string'], // the label to show beside the y-axis
  yScaleType: ['linear', ['linear', 'log']], // the y-axis scale type
  yax_count: [3, 'number'], // the number of y-axis ticks
  yaxFormat: [null, 'function'], // a function that formats the y-axis' labels
  yaxTickLength: [5, 'number'], // the y-axis' tick length in pixels
  yaxUnits: ['', 'string'], // a prefix symbol to be shown alongside the y-axis' labels
  yaxUnitsAppend: [false, 'boolean'], // determines whether to append rather than prepend units
  // GraphicOptions
  aggregateRollover: [false, 'boolean'], // links the lines in a multi-line graphic
  animate_on_load: [false, 'boolean'], // determines whether lines are transitioned on first-load
  area: [true, ['boolean', 'array']], // determines whether to fill the area below the line
  flip_area_under_y_value: [null, 'number'], // Specify a Y baseline number value to flip area under it
  baselines: [null, 'object[]'], // horizontal lines that indicate, say, goals.
  chartType: ['line', ['line', 'histogram', 'point', 'bar', 'missing-data']], // '{line, histogram, point, bar, missing-data}'],
  color: [null, ['string', 'string[]']],
  colors: [null, ['string', 'string[]']],
  custom_line_color_map: [[], 'number[]'], // maps an arbitrary set of lines to colors
  decimals: [2, 'number'], // the number of decimals to show in a rollover
  error: ['', 'string'], // does the graphic have an error that we want to communicate to users
  format: ['count', ['count', 'percentage']], // the format of the data object (count or percentage)
  full_height: [false, 'boolean'], // sets height to that of the parent, adjusts dimensions on window resize
  full_width: [false, 'boolean'], // sets width to that of the parent, adjusts dimensions on window resize
  interpolate: [d3.curveCatmullRom.alpha(0), [d3.curveBasisClosed, d3.curveBasisOpen, d3.curveBasis, d3.curveBundle, d3.curveCardinalClosed, d3.curveCardinalOpen, d3.curveCardinal, d3.curveCatmullRomClosed, d3.curveCatmullRomOpen, d3.curveLinearClosed, d3.curveLinear, d3.curveMonotoneX, d3.curveMonotoneY, d3.curveNatural, d3.curveStep, d3.curveStepAfter, d3.curveStepBefore]], // the interpolation function to use for rendering lines
  legend: ['', 'string[]'], // an array of literals used to label lines
  legend_target: ['', 'string'], // the DOM element to insert the legend in
  linked: [false, 'boolean'], // used to link multiple graphics together
  linked_format: ['%Y-%m-%d', 'string'], // specifies the format of linked rollovers
  list: [false, 'boolean'], // automatically maps the data to x and y accessors
  markers: [null, 'object[]'], // vertical lines that indicate, say, milestones
  max_data_size: [null, 'number'], // for use with custom_line_color_map
  missing_text: [null, 'string'], // The text to display for missing graphics
  show_missing_background: [true, 'boolean'], // Displays a background for missing graphics
  mousemove_align: ['right', 'string'], // implemented in point.js
  xMouseover: [null, ['string', 'function']],
  yMouseover: [null, ['string', 'function']],
  mouseover: [null, 'function'], // custom rollover function
  mousemove: [null, 'function'], // custom rollover function
  mouseout: [null, 'function'], // custom rollover function
  click: [null, 'function'],
  point_size: [2.5, 'number'], // the radius of the dots in the scatterplot
  active_point_on_lines: [false, 'boolean'], // if set, active dot on lines will be displayed.
  active_point_accessor: ['active', 'string'], // data accessor value to determine if a point is active or not
  active_point_size: [2, 'number'], // the size of the dot that appears on a line when
  points_always_visible: [false, 'boolean'], //  whether to always display data points and not just on hover
  rollover_time_format: [null, 'string'], // custom time format for rollovers
  show_confidence_band: [null, 'string[]'], // determines whether to show a confidence band
  show_rollover_text: [true, 'boolean'], // determines whether to show text for a data point on rollover
  show_tooltips: [true, 'boolean'], // determines whether to display descriptions in tooltips
  showActivePoint: [true, 'boolean'], // If enabled show active data point information in chart
  target: ['#viz', ['string', HTMLElement]], // the DOM element to insert the graphic in
  transition_on_update: [true, 'boolean'], // gracefully transitions the lines on data change
  xRug: [false, 'boolean'], // show a rug plot along the x-axis
  yRug: [false, 'boolean'], // show a rug plot along the y-axis
  mouseover_align: ['right', ['right', 'left']],
  brush: [null, ['xy', 'x', 'y']], // add brush function
  brushing_selection_changed: [null, 'function'], // callback function on brushing. the first parameter are the arguments that correspond to this chart, the second parameter is the range of the selection
  zoom_target: [null, 'object'], // the zooming target of brushing function
  click_to_zoom_out: [true, 'boolean'], // if true and the graph is currently zoomed in, clicking on the graph will zoom out
  // Layout
  buffer: [8, 'number'], // the padding around the graphic
  bottom: [45, 'number'], // the size of the bottom margin
  center_title_full_width: [false, 'boolean'], // center title over entire graph
  height: [220, 'number'], // the graphic's height
  left: [50, 'number'], // the size of the left margin
  right: [10, 'number'], // the size of the right margin
  small_height_threshold: [120, 'number'], // maximum height for a small graphic
  small_width_threshold: [160, 'number'], // maximum width for a small graphic
  top: [65, 'number'], // the size of the top margin
  width: [350, 'number'], // the graphic's width
  title_y_position: [10, 'number'], // how many pixels from the top edge (0) should we show the title at
  title: [null, 'string'],
  description: [null, 'string']
}

MG.charts = {}

MG.defaults = optionsToDefaults(MG.options)

MG.data_graphic = function (args) {
  'use strict'

  MG.callHook('global.defaults', MG.defaults)

  if (!args) { args = {} }

  var selected_chart = MG.charts[args.chartType || MG.defaults.chartType]
  deepmerge(args, selected_chart.defaults, MG.defaults)

  if (args.list) {
    args.xAccessor = 0
    args.yAccessor = 1
  }

  // check for deprecated parameters
  for (var key in MG.deprecations) {
    if (args.hasOwnProperty(key)) {
      var deprecation = MG.deprecations[key]
      var message = 'Use of `args.' + key + '` has been deprecated'
      var replacement = deprecation.replacement
      var version

      // transparently alias the deprecated
      if (replacement) {
        if (args[replacement]) {
          message += '. The replacement - `args.' + replacement + '` - has already been defined. This definition will be discarded.'
        } else {
          args[replacement] = args[key]
        }
      }

      if (deprecation.warned) {
        continue
      }

      deprecation.warned = true

      if (replacement) {
        message += ' in favor of `args.' + replacement + '`'
      }

      warnDeprecation(message, deprecation.version)
    }
  }

  MG.callHook('global.before_init', args)

  new selected_chart.descriptor(args)

  return args.data
}
