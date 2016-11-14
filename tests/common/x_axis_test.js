module('x_axis');

test('X-axis is added', function() {
    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 12},
               {'date': new Date('2014-03-01'), 'value': 18}]
    };

    MG.data_graphic(params);
    ok(document.querySelector('.mg-x-axis'), 'X-axis is added');
});

test('args.x_axis set to false', function() {
    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 12},
               {'date': new Date('2014-03-01'), 'value': 18}],
        x_axis: false
    };

    MG.data_graphic(params);
    equal(document.querySelector('.mg-x-axis'), null, 'X-axis is not added');
});

test('Only one x-axis is added on multiple calls to the same target element', function() {
    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 12},
               {'date': new Date('2014-03-01'), 'value': 18}]
    };

    MG.data_graphic(params);
    MG.data_graphic(MG.clone(params));

    equal(document.querySelectorAll(params.target + ' .mg-x-axis').length, 1, 'We only have one x-axis');
});

test('args.show_secondary_x_label: true', function() {
    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 12},
               {'date': new Date('2014-03-01'), 'value': 18}]
    };

    MG.data_graphic(params);
    ok(document.querySelector('.mg-year-marker'), 'Year marker exists');
});

test('args.show_secondary_x_label: false', function() {
    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 12},
               {'date': new Date('2014-03-01'), 'value': 18}],
        show_secondary_x_label: false
    };

    MG.data_graphic(params);
    equal(document.querySelector('.mg-year-marker'), null, 'Year marker not added');
});

test('args.x_label', function() {
    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 12},
               {'date': new Date('2014-03-01'), 'value': 18}],
        x_label: 'foo bar'
    };

    MG.data_graphic(params);
    ok(document.querySelector('.mg-x-axis .label'), 'X-axis label exists');
});

test('args.labels (scatter plot)', function() {
    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 12},
               {'date': new Date('2014-03-01'), 'value': 18}],
        x_label: 'foo bar',
        y_label: 'bar foo',
        chart_type: 'point'
    };

    MG.data_graphic(params);
    ok(document.querySelector('.mg-x-axis .label'), 'X-axis label exists');
    ok(document.querySelector('.mg-y-axis .label'), 'Y-axis label exists');
});

test('X-axis doesn\'t break when data object is of length 1', function() {
    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 12}]
    };

    MG.data_graphic(params);
    ok(document.querySelector('.mg-x-axis'), 'X-axis exists');
});

test('args.x_rug', function() {
    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 12},
               {'date': new Date('2014-03-01'), 'value': 18}],
        x_rug: true
    };

    MG.data_graphic(params);
    ok(document.querySelector('.mg-x-rug'), 'X-axis rugplot exists');
});

test('Only one rugplot is added on multiple calls to the same target element', function() {
    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 12},
               {'date': new Date('2014-03-01'), 'value': 18}],
        x_rug: true
    };

    MG.data_graphic(params);
    MG.data_graphic(MG.clone(params));

    equal(document.querySelectorAll('.mg-x-rug').length, 2, 'We only have one rugplot on the x-axis');
});

test('args.x_extended_ticks', function() {
    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 12},
               {'date': new Date('2014-03-01'), 'value': 18}],
        x_extended_ticks: true
    };

    MG.data_graphic(params);
    ok(document.querySelector('.mg-extended-xax-ticks'), 'X-axis extended ticks exist');
});

test('Correctly calculates min and max values for line, point and histogram charts', function() {
    // single series
    var params = {
        target: '#qunit-fixture',
        x_accessor: 'x',
        y_accessor: 'y',
        data: [
            [
                {x: 4, y: 5},
                {x: 5, y: 5},
                {x: 6, y: 5},
                {x: 7, y: 5}
            ]
        ]
    };
    MG.data_graphic(params);
    equal(params.processed.min_x, 4, 'min is correct for single series');
    equal(params.processed.max_x, 7, 'max is correct for single series');

    // multiple series
    var params2 = {
        target: '#qunit-fixture',
        x_accessor: 'x',
        y_accessor: 'y',
        data: [
            [
                {x: 1, y: 5},
                {x: 2, y: 5},
                {x: 3, y: 5},
                {x: 4, y: 5}
            ], [
                {x: 5, y: 5},
                {x: 6, y: 5},
                {x: 7, y: 5}
            ]
        ]
    };
    MG.data_graphic(params2);
    equal(params2.processed.min_x, 1, 'min is correct for multiple series');
    equal(params2.processed.max_x, 7, 'max is correct for multiple series');
});

/*test('Correctly calculates min and max values for bar chart', function() {
    var args;

    // single series
    args = {
        x_accessor: 'x',
        baseline_accessor: 'b',
        predictor_accessor: 'p',
        chart_type: 'bar',
        target: '#qunit-fixture',
        data: [
            [
                {x: 4, b: 3, p: 2},
                {x: 5, b: 2, p: 6},
                {x: 6, b: 1, p: 10},
                {x: 7, b: 0, p: 12}
            ]
        ]
    };
    MG.data_graphic(args);
    equal(args.processed.min_x, 0, 'min is correct');
    equal(args.processed.max_x, 12, 'max is correct');
});*/

test('Ensure that custom xax_format isn\'t deleted', function() {
    var params = {
        title: 'foo',
        target: '.result',
        xax_format: function(d) { return 'humbug'; },
        data: [{'date': new Date('2014-01-01'), 'value': 12},
               {'date': new Date('2014-03-01'), 'value': 18}]
    };

    MG.data_graphic(params);
    equal(params.xax_format(), 'humbug', 'xax_format hasn\'t been overriden');
});

test('Ensure that default null xax_format is respected; allow MG to recalculate the default on redraw', function() {
    var params = {
        title: 'foo',
        target: '.result',
        xax_format: null,
        data: [{'date': new Date('2014-01-01'), 'value': 12},
               {'date': new Date('2014-03-01'), 'value': 18}]
    };

    MG.data_graphic(params);
    equal(params.xax_format, null, 'xax_format is still null');
});
