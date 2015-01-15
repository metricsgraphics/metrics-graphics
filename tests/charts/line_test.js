module('line');

test('Confidence band is added', function() {
    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 12, 'l': 10, 'u': 14},
               {'date': new Date('2014-03-01'), 'value': 18, 'l': 16, 'u': 20}],
        show_confidence_band: ['l', 'u']
    };

    MG.data_graphic(params);
    ok(document.querySelector('.mg-confidence-band'), 'Confidence band is added');
});

test('Only one confidence is added on multiple calls to the same target element', function() {
    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 12, 'l': 10, 'u': 14},
               {'date': new Date('2014-03-01'), 'value': 18, 'l': 16, 'u': 20}],
        show_confidence_band: ['l', 'u']
    };

    MG.data_graphic(params);
    MG.data_graphic(MG.clone(params));

    equal(document.querySelectorAll(target + ' .mg-confidence-band').length, 1, 'We only have one confidence band');
});

test('args.area set to true', function() {
    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 12},
               {'date': new Date('2014-03-01'), 'value': 18}]
    };

    MG.data_graphic(params);
    ok(document.querySelector('.mg-main-area'), 'Path set for area');
});

test('args.area set to false', function() {
    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 12},
               {'date': new Date('2014-03-01'), 'value': 18}],
        area: false
    };

    MG.data_graphic(params);
    equal(document.querySelector('.mg-main-area'), null, 'No path for area');
});

test('A solitary active datapoint exists', function() {
    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 12},
               {'date': new Date('2014-03-01'), 'value': 18}]
    };

    MG.data_graphic(params);
    equal(document.querySelectorAll('.mg-active-datapoint').length, 1, 'One active datapoint exists');
});

test('A solitary rollover circle exists', function() {
    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 12},
               {'date': new Date('2014-03-01'), 'value': 18}]
    };

    MG.data_graphic(params);
    equal(document.querySelectorAll('.mg-line-rollover-circle').length, 1, 'One rollover circle exists');
});

test('Rollovers work for single lines', function() {
    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 12},
               {'date': new Date('2014-03-01'), 'value': 18}]
    };

    MG.data_graphic(params);
    ok(document.querySelector('.mg-rollover-rect'), 'Rollovers exist');
});

test('Rollovers work for multiple lines', function() {
    var params = {
        target: '#qunit-fixture',
        data: [[{'date': new Date('2014-01-01'), 'value': 12},
               {'date': new Date('2014-03-01'), 'value': 18}],
               [{'date': new Date('2014-01-01'), 'value': 120},
               {'date': new Date('2014-03-01'), 'value': 180}]]
    };

    MG.data_graphic(params);
    ok(document.querySelector('.mg-voronoi'), 'Rollovers exist');
});

test('We have only one set of rollovers for single lines', function() {
    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 12},
               {'date': new Date('2014-03-01'), 'value': 18}]
    };

    MG.data_graphic(params);
    equal(document.querySelectorAll('.mg-rollover-rect').length, 1, 'One set of rollovers exists');
});

test('We have only one set of rollovers for multiple lines', function() {
    var params = {
        target: '#qunit-fixture',
        data: [[{'date': new Date('2014-01-01'), 'value': 12},
               {'date': new Date('2014-03-01'), 'value': 18}],
               [{'date': new Date('2014-01-01'), 'value': 120},
               {'date': new Date('2014-03-01'), 'value': 180}]]
    };

    MG.data_graphic(params);
    equal(document.querySelectorAll('.mg-voronoi').length, 1, 'One set of rollovers exists');
});

test('There are as many lines as data series (one)', function() {
    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 12},
               {'date': new Date('2014-03-01'), 'value': 18}]
    };

    MG.data_graphic(params);
    equal(document.querySelectorAll('.mg-main-line').length, 1, 'One line exists');
});

test('There are as many lines as data series (two)', function() {
    var params = {
        target: '#qunit-fixture',
        data: [[{'date': new Date('2014-01-01'), 'value': 12},
               {'date': new Date('2014-03-01'), 'value': 18}],
               [{'date': new Date('2014-01-01'), 'value': 120},
               {'date': new Date('2014-03-01'), 'value': 180}]]
    };

    MG.data_graphic(params);
    equal(document.querySelectorAll('.mg-main-line').length, 2, 'Two lines exist');
});

test('There are as many lines as data series (two) on multiple calls to an existing chart', function() {
    var params = {
        target: '#qunit-fixture',
        data: [[{'date': new Date('2014-01-01'), 'value': 12},
               {'date': new Date('2014-03-01'), 'value': 18}],
               [{'date': new Date('2014-01-01'), 'value': 120},
               {'date': new Date('2014-03-01'), 'value': 180}]]
    };

    MG.data_graphic(params);
    MG.data_graphic(MG.clone(params));

    equal(document.querySelectorAll('.mg-main-line').length, 2, 'Two lines exist');
});
