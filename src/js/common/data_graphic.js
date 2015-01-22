var charts = {};

MG.globals = {};
MG.deprecations = {
    rollover_callback: { replacement: 'mouseover', version: '2.0' },
    rollout_callback: { replacement: 'mouseout', version: '2.0' },
    show_years: { replacement: 'show_secondary_x_label', version: '2.1' }
};
MG.globals.link = false;
MG.globals.version = "1.1";

MG.data_graphic = function() {
    'use strict';
    var defaults = {};
    defaults.all = {
        missing_is_zero: false,       // if true, missing values will be treated as zeros
        legend: '' ,                  // an array identifying the labels for a chart's lines
        legend_target: '',            // if set, the specified element is populated with a legend
        error: '',                    // if set, a graph will show an error icon and log the error to the console
        animate_on_load: false,       // animate lines on load
        top: 40,                      // the size of the top margin
        bottom: 30,                   // the size of the bottom margin
        right: 10,                    // size of the right margin
        left: 50,                     // size of the left margin
        buffer: 8,                    // the buffer between the actual chart area and the margins
        width: 350,                   // the width of the entire graphic
        height: 220,                  // the height of the entire graphic
        full_width: false,            // sets the graphic width to be the width of the parent element and resizes dynamically
        full_height: false,           // sets the graphic width to be the width of the parent element and resizes dynamically
        small_height_threshold: 120,  // the height threshold for when smaller text appears
        small_width_threshold: 160,   // the width  threshold for when smaller text appears
        small_text: false,            // coerces small text regardless of graphic size
        xax_count: 6,                 // number of x axis ticks
        xax_tick_length: 5,           // x axis tick length
        yax_count: 5,                 // number of y axis ticks
        yax_tick_length: 5,           // y axis tick length
        x_extended_ticks: false,      // extends x axis ticks across chart - useful for tall charts
        y_extended_ticks: false,      // extends y axis ticks across chart - useful for long charts
        y_scale_type: 'linear',
        max_x: null,
        max_y: null,
        min_x: null,
        min_y: null,                  // if set, y axis starts at an arbitrary value
        min_y_from_data: false,       // if set, y axis will start at minimum value rather than at 0
        point_size: 2.5,              // the size of the dot that appears on a line on mouse-over
        x_accessor: 'date',
        xax_units: '',
        x_label: '',
        x_axis: true,
        y_axis: true,
        y_accessor: 'value',
        y_label: '',
        yax_units: '',
        x_rug: false,
        y_rug: false,
        transition_on_update: true,
        mouseover: null,
        show_rollover_text: true,
        show_confidence_band: null,   // given [l, u] shows a confidence at each point from l to u
        xax_format: null,             // xax_format is a function that formats the labels for the x axis.
        area: true,
        chart_type: 'line',
        data: [],
        decimals: 2,                  // the number of decimals in any rollover
        format: 'count',              // format = {count, percentage}
        inflator: 10/9,               // for setting y axis max
        linked: false,                // links together all other graphs with linked:true, so rollovers in one trigger rollovers in the others
        linked_format: '%Y-%m-%d',    // What granularity to link on for graphs. Default is at day
        list: false,
        baselines: null,              // sets the baseline lines
        markers: null,                // sets the marker lines
        scalefns: {},
        scales: {},
        show_secondary_x_label: true,
        target: '#viz',
        interpolate: 'cardinal',       // interpolation method to use when rendering lines
        custom_line_color_map: [],     // allows arbitrary mapping of lines to colors, e.g. [2,3] will map line 1 to color 2 and line 2 to color 3
        max_data_size: null,           // explicitly specify the the max number of line series, for use with custom_line_color_map
        aggregate_rollover: false      // links the lines in a multi-line chart
    };

    defaults.point = {
        buffer: 16,
        ls: false,
        lowess: false,
        point_size: 2.5,
        size_accessor: null,
        color_accessor: null,
        size_range: null,              // when we set a size_accessor option, this array determines the size range, e.g. [1,5]
        color_range: null,             // e.g. ['blue', 'red'] to color different groups of points
        size_domain: null,
        color_domain: null,
        color_type: 'number'           // can be either 'number' - the color scale is quantitative - or 'category' - the color scale is qualitative.
    };

    defaults.histogram = {
        mouseover: function(d, i) {
            $('#histogram svg .mg-active-datapoint')
                .html('Frequency Count: ' + d.y);
        },
        binned: false,
        bins: null,
        processed_x_accessor: 'x',
        processed_y_accessor: 'y',
        processed_dx_accessor: 'dx',
        bar_margin: 1
    };

    defaults.bar = {
        y_accessor: 'factor',
        x_accessor: 'value',
        baseline_accessor: null,
        predictor_accessor: null,
        predictor_proportion: 5,
        dodge_accessor: null,
        binned: true,
        padding_percentage: 0,
        outer_padding_percentage: 0.1,
        height: 500,
        top: 20,
        bar_height: 20,
        left: 70
    };

    defaults.missing = {
        top: 40,                      // the size of the top margin
        bottom: 30,                   // the size of the bottom margin
        right: 10,                    // size of the right margin
        left: 10,                     // size of the left margin
        buffer: 8,                    // the buffer between the actual chart area and the margins
        legend_target: '',
        width: 350,
        height: 220,
        missing_text: 'Data currently missing or unavailable',
        scalefns: {},
        scales: {},
        show_missing_background: true,
        interpolate: 'cardinal'
    };

    var args = arguments[0];
    if (!args) { args = {}; }

    if (args.list) {
        args.x_accessor = 0;
        args.y_accessor = 1;
    }

    // check for deprecated parameters
    for (var key in MG.deprecations) {
        if (args.hasOwnProperty(key)) {
            var deprecation = MG.deprecations[key],
                message = 'Use of `args.' + key + '` has been deprecated',
                replacement = deprecation.replacement,
                version;

            // transparently alias the deprecated
            if (replacement) {
                if (args[replacement]) {
                    message += '. The replacement - `args.' + replacement + '` - has already been defined. This definition will be discarded.';
                } else {
                    args[replacement] = args[key];
                }
            }

            if (deprecation.warned) {
                continue;
            }

            deprecation.warned = true;

            if (replacement) {
                message += ' in favor of `args.' + replacement + '`';
            }

            warnDeprecation(message, deprecation.version);
        }
    }

    //build the chart
    var a;
    if (args.chart_type === 'missing-data') {
        args = merge_with_defaults(args, defaults.missing);
        charts.missing(args);
    }
    else if (args.chart_type === 'point') {
        a = merge_with_defaults(defaults.point, defaults.all);
        args = merge_with_defaults(args, a);
        charts.point(args).mainPlot().markers().rollover().windowListeners();
    }
    else if (args.chart_type === 'histogram') {
        a = merge_with_defaults(defaults.histogram, defaults.all);
        args = merge_with_defaults(args, a);
        charts.histogram(args).mainPlot().markers().rollover().windowListeners();
    }
    else if (args.chart_type === 'bar') {
        a = merge_with_defaults(defaults.bar, defaults.all);
        args = merge_with_defaults(args, a);
        charts.bar(args).mainPlot().markers().rollover().windowListeners();
    }
    else {
        args = merge_with_defaults(args, defaults.all);
        charts.line(args).markers().mainPlot().rollover().windowListeners();
    }

    return args.data;
};
