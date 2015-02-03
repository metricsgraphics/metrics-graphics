module('init');

test('Chart\'s width is set correctly on subsequent calls to existing chart', function() {
    var params_0 = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-11-01'), 'value': 12},
               {'date': new Date('2014-11-02'), 'value': 18}],
    };

    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-11-01'), 'value': 12},
               {'date': new Date('2014-11-02'), 'value': 18}],
        width: 200,
        height: 100,
    };

    MG.data_graphic(params_0);
    MG.data_graphic(params);

    var width = document.querySelector(params.target + ' svg').offsetWidth;
    ok(width == 200, 'SVG\'s width matches latest specified width');
});

test('Chart\'s height is set correctly on subsequent calls to existing chart', function() {
    var params_0 = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-11-01'), 'value': 12},
               {'date': new Date('2014-11-02'), 'value': 18}],
    };

    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-11-01'), 'value': 12},
               {'date': new Date('2014-11-02'), 'value': 18}],
        width: 200,
        height: 100,
    };

    MG.data_graphic(params_0);
    MG.data_graphic(params);

    var height = document.querySelector(params.target + ' svg').offsetHeight;
    ok(height == params.height, 'SVG\'s height matches latest specified height');
});

test('Charts are plotted correctly when MG is called multiple times on the same target element', function() {
    var params_0 = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-11-01'), 'value': 12},
               {'date': new Date('2014-11-02'), 'value': 18}]
    };

    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-11-01'), 'value': 12},
               {'date': new Date('2014-11-02'), 'value': 18}],
        width: 200,
        height: 100,
    };

    MG.data_graphic(params_0);
    MG.data_graphic(params);

    //ensure chart types change appropriately
    var line = document.querySelector('.mg-main-line');
    ok(line, 'chart_type is `line`, line chart is plotted');

    //check all the other chart types
    var chart_types = [{id: 'point', domElement: '.mg-points'},
        {id: 'histogram', domElement: '.mg-histogram'},
        {id: 'bar', domElement: '.mg-barplot'}];

    for(var i = 0; i < chart_types.length; i++) {
        var params = {
            target: '#qunit-fixture',
            data: [{'date': new Date('2014-11-01'), 'value': 12},
                   {'date': new Date('2014-11-02'), 'value': 18}],
            chart_type: chart_types[i].id,
            width: 200,
            height: 100,
        };

        MG.data_graphic(params);
        ok(document.querySelector(chart_types[i].domElement),
            'chart_type switched to `' + chart_types[i].id + '`, the correct chart type is plotted');
            
        //ensure old chart was removed
        equal(document.querySelectorAll('.mg-main-line').length, 0, 'line chart (old one) was removed');
    }
});

test('Missing chart has required class name set', function() {
    expect(1);
    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-11-01'), 'value': 12},
               {'date': new Date('2014-11-02'), 'value': 18}],
        chart_type: 'missing-data'
    };

    MG.data_graphic(params);

    var matches = document.querySelector(params.target + ' svg').getAttribute('class').match(/mg-missing/);
    ok(matches, 'Missing chart has class `missing` set');
});

test('Linked chart has the required class set', function() {
    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-11-01'), 'value': 12},
               {'date': new Date('2014-11-02'), 'value': 18}],
        linked: true
    };

    MG.data_graphic(params);

    var matches = document.querySelector(params.target + ' svg').getAttribute('class').match(/linked/);
    ok(matches, 'Linked chart has class `linked` set');
});

test('args.time_series is set to true when data is time-series', function() {
    var params = {
        target: '#qunit-fixture',
        data: [{'foo': new Date('2014-11-01'), 'value': 12},
               {'foo': new Date('2014-11-02'), 'value': 18}],
        x_accessor: 'foo'
    };

    MG.data_graphic(params);
    ok(params.time_series, 'args.time_series is set to true when data is time-series');
});

test('args.time_series is set to false when data is not time-series', function() {
    var params = {
        target: '#qunit-fixture',
        data: [{'foo': 100, 'value': 12},
               {'foo': 200, 'value': 18}],
        x_accessor: 'foo'
    };

    MG.data_graphic(params);
    equal(params.time_series, false, 'args.time_series is set to false when data is not time-series');
});

test('Only one clip path is added on multiple calls to the same target element', function() {
    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 12, 'l': 10, 'u': 14},
               {'date': new Date('2014-03-01'), 'value': 18, 'l': 16, 'u': 20}]
    };

    MG.data_graphic(params);
    MG.data_graphic(MG.clone(params));

    equal(document.querySelectorAll('.mg-clip-path').length, 1, 'We only have one clip path');
});