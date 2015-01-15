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
    
    equal(document.querySelectorAll(target + ' .mg-x-axis').length, 1, 'We only have one x-axis');
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

test('X-axis doesn\'t break when data object is of length 1', function() {
    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 12}]
    };

    MG.data_graphic(params);
    ok(document.querySelector('.mg-x-axis'), 'X-axis exists');
});

test('args.small_text', function() {
    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 12}],
        small_text: true,
    };

    MG.data_graphic(params);
    ok(document.querySelector('.mg-x-axis-small'), 'Small x-axis is set');
});

test('args.small_text and args.show_secondary_x_label', function() {
    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 12},
               {'date': new Date('2014-03-01'), 'value': 18}],
        small_text: true
    };

    MG.data_graphic(params);
    ok(document.querySelector('.mg-year-marker-small'), 'Small year-marker is set');
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
    ok(document.querySelector('.mg-extended-x-ticks'), 'X-axis extended ticks exist');
});
