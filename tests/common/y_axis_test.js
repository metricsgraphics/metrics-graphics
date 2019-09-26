module('y_axis');

test('Y-axis is added', function() {
    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 12},
               {'date': new Date('2014-03-01'), 'value': 18}]
    };

    MG.data_graphic(params);
    ok(document.querySelector('.mg-y-axis'), 'Y-axis is added');
});

test('args.y_axis set to false', function() {
    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 12},
               {'date': new Date('2014-03-01'), 'value': 18}],
        y_axis: false
    };

    MG.data_graphic(params);
    equal(document.querySelector('.mg-y-axis'), null, 'Y-axis is not added');
});

test('Only one y-axis is added on multiple calls to the same target element', function() {
    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 12},
               {'date': new Date('2014-03-01'), 'value': 18}]
    };

    MG.data_graphic(params);
    MG.data_graphic(MG.clone(params));

    equal(document.querySelectorAll(params.target + ' .mg-y-axis').length, 1, 'We only have one y-axis');
});

test('Only one mg-category-guides group is added on multiple calls to the same target element', function() {
    var params = {
        target: '#qunit-fixture',
        data: [{"year": "1945","sightings": 6},{"year": "1946","sightings": 8}],
        chart_type: 'point',
        y_accessor: "year",
        x_accessor: "sightings",
    };

    MG.data_graphic(params);
    MG.data_graphic(MG.clone(params));

    equal(document.querySelectorAll(params.target + ' .mg-category-guides').length, 1, 'We only have one mg-category-guides');
});

test('args.y_label', function() {
    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 12},
               {'date': new Date('2014-03-01'), 'value': 18}],
        y_label: 'foo bar'
    };

    MG.data_graphic(params);
    ok(document.querySelector('.mg-y-axis .label'), 'Y-axis label exists');
});

test('Y-axis doesn\'t break when data object is of length 1', function() {
    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 12}]
    };

    MG.data_graphic(params);
    ok(document.querySelector('.mg-y-axis'), 'Y-axis exists');
});

// test('args.small_text', function() {
//     var params = {
//         target: '#qunit-fixture',
//         data: [{'date': new Date('2014-01-01'), 'value': 12}],
//         small_text: true,
//     };

//     MG.data_graphic(params);
//     ok(document.querySelector('.mg-y-axis-small'), 'Small y-axis is set');
// });

test('args.y_rug', function() {
    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 12},
               {'date': new Date('2014-03-01'), 'value': 18}],
        y_rug: true
    };

    MG.data_graphic(params);
    ok(document.querySelector('.mg-y-rug'), 'Y-axis rugplot exists');
});

test('Only one rugplot is added on multiple calls to the same target element', function() {
    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 12},
               {'date': new Date('2014-03-01'), 'value': 18}],
        y_rug: true
    };

    MG.data_graphic(params);
    MG.data_graphic(MG.clone(params));
    equal(document.querySelectorAll('.mg-y-rug').length, 2, 'We only have one rugplot on the y-axis');
});

test('Default min_y is 0', function() {
    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 12},
               {'date': new Date('2014-03-01'), 'value': 18}]
    };

    MG.data_graphic(params);
    equal(document.querySelectorAll('.mg-y-axis text')[0].textContent, 0, 'Y-axis starts at 0');
});

test('args.min_y_from_data', function() {
    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 12},
               {'date': new Date('2014-03-01'), 'value': 18}],
        min_y_from_data: true
    };

    MG.data_graphic(params);
    equal(document.querySelectorAll('.mg-y-axis text')[0].textContent, 12, 'Y-axis starts at 12');
});

test('args.min_y set to arbitrary value', function() {
    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 12},
               {'date': new Date('2014-03-01'), 'value': 18}],
        min_y: 5
    };

    MG.data_graphic(params);
    equal(document.querySelectorAll('.mg-y-axis text')[0].textContent, 5, 'Y-axis starts at 5');
});

test('args.y_extended_ticks', function() {
    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 12},
               {'date': new Date('2014-03-01'), 'value': 18}],
        y_extended_ticks: true
    };

    MG.data_graphic(params);
    ok(document.querySelector('.mg-extended-yax-ticks'), 'Y-axis extended ticks exist');
});

test('args.format is set to percentage', function() {
    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 0.12},
               {'date': new Date('2014-03-01'), 'value': 0.18}],
        format: 'percentage'
    };

    MG.data_graphic(params);
    equal(document.querySelectorAll('.mg-y-axis text')[0].textContent.slice(-1), '%', 'Y-axis units are %');
});

test('percentage args.format is correct', function() {
    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 0.80},
               {'date': new Date('2014-03-01'), 'value': 1.20}],
        format: 'percentage',
        height: 400,
        min_y_from_data: true
    };

    MG.data_graphic(params);
    equal(document.querySelectorAll('.mg-y-axis text')[2].textContent, '120%', 'Y-axis label formats correctly');
});

test('args.yax_units', function() {
    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 2.12},
               {'date': new Date('2014-03-01'), 'value': 4.18}],
        yax_units: '$',
    };

    MG.data_graphic(params);
    equal(document.querySelector('.mg-y-axis text').textContent[0], '$', 'Y-axis units are $');
});

test('When args.max_y is set, ignore inflator', function() {
    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 12},
               {'date': new Date('2014-03-01'), 'value': 18}],
        max_y: 60,
    };

    MG.data_graphic(params);
    var nodes = document.querySelectorAll('.mg-y-axis text');
    equal(nodes[nodes.length - 1].textContent, 60, 'Maximum y-axis value is 60');
});
