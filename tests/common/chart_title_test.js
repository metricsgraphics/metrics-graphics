module('chart_title');

test('Chart title is updated', function() {
    var params = {
        title: 'foo',
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 12},
               {'date': new Date('2014-03-01'), 'value': 18}]
    };

    var params2 = MG.clone(params);
    params2.title = 'bar';

    MG.data_graphic(params);
    MG.data_graphic(params2);

    equal(document.querySelector('.mg-chart-title').textContent, 'bar', 'Chart title is foo');
});

test('Chart title is removed if title is set to blank', function() {
    var params = {
        title: 'foo',
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 12},
               {'date': new Date('2014-03-01'), 'value': 18}]
    };

    var params2 = MG.clone(params);
    params2.title = '';

    MG.data_graphic(params);
    MG.data_graphic(params2);
    equal(document.querySelector('.mg-chart-title'), null, 'Chart title is not added');
});

test('Chart title is removed if title is not set', function() {
    var params = {
        title: 'foo',
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 12},
               {'date': new Date('2014-03-01'), 'value': 18}]
    };

    var params2 = MG.clone(params);
    delete params2.title;

    MG.data_graphic(params);
    MG.data_graphic(params2);
    equal(document.querySelector('.mg-chart-title'), null, 'Chart title is not added');
});

test('When a description is set, we get a question mark', function() {
    var params = {
        title: 'foo',
        description: 'bar',
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 12},
               {'date': new Date('2014-03-01'), 'value': 18}],
        show_tooltips: true
    };

    MG.data_graphic(params);
    ok(document.querySelector('.mg-chart-description'), 'Description icon exists');
});

test('When an error is set, we get an exclamation icon', function() {
    var params = {
        title: 'foo',
        description: 'bar',
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 12},
               {'date': new Date('2014-03-01'), 'value': 18}],
        error: 'lorem ipsum'
    };

    MG.data_graphic(params);
    ok(document.querySelector('.mg-chart-title .mg-warning'), 'Error icon exists');
});

test('Chart title is not duplicated on redraw', function() {
    var params = {
        title: 'foo',
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 12},
               {'date': new Date('2014-03-01'), 'value': 18}]
    };

    var params2 = MG.clone(params);
    MG.data_graphic(params);
    MG.data_graphic(params2);

    equal(document.querySelectorAll('.mg-chart-title').length, 1, 'there is once chart title');
});
