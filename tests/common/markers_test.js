module('markers');

test('All markers are added if they lie within the visible range', function() {
    var markers = [{
            'date': new Date('2014-02-01'),
            'label': '1st Milestone'
        }, {
            'date': new Date('2014-02-02'),
            'label': '2nd Milestone'
        }];

    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 12},
               {'date': new Date('2014-03-01'), 'value': 18}],
        markers: markers
    };

    MG.data_graphic(params);
    equal(document.querySelectorAll(params.target + ' .mg-markers line').length, markers.length, 'Two markers added');
});

test('Markers that lie outside the visible range are excluded', function() {
    var markers = [{
            'date': new Date('2014-02-01'),
            'label': '1st Milestone'
        }, {
            'date': new Date('2014-02-03'),
            'label': '2nd Milestone'
        }];

    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-02-02'), 'value': 12},
               {'date': new Date('2014-03-01'), 'value': 18}],
        markers: markers
    };

    MG.data_graphic(params);
    equal(document.querySelectorAll(params.target + ' .mg-markers line').length, 1, 'One marker added');
});

test('Markers that lie at the edge of the visible range are included', function() {
    var markers = [{
            'date': new Date('2014-02-01'),
            'label': '1st Milestone'
        }, {
            'date': new Date('2014-03-01'),
            'label': '2nd Milestone'
        }];

    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-02-01'), 'value': 12},
               {'date': new Date('2014-03-01'), 'value': 18}],
        markers: markers
    };

    MG.data_graphic(params);
    equal(document.querySelectorAll(params.target + ' .mg-markers line').length, markers.length, 'Two markers added');
});

test('All baselines are added', function() {
    var baselines = [{value:50, label:'a baseline'}];

    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 100},
               {'date': new Date('2014-03-01'), 'value': 10}],
        baselines: baselines
    };

    MG.data_graphic(params);
    equal(document.querySelectorAll(params.target + ' .mg-baselines line').length, markers.length, 'One baseline added');
});

test('Markers\' texts are correctly added', function() {
    var markers = [{
            'date': new Date('2014-02-01'),
            'label': '1st Milestone'
        }, {
            'date': new Date('2014-02-02'),
            'label': '2nd Milestone'
        }];

    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 100},
               {'date': new Date('2014-03-01'), 'value': 10}],
        markers: markers
    };

    MG.data_graphic(params);
    equal(document.querySelectorAll(params.target + ' .mg-markers text')[0].textContent, markers[0].label, 'First marker\'s text matches specified one');
    equal(document.querySelectorAll(params.target + ' .mg-markers text')[1].textContent, markers[1].label, 'Second marker\'s text matches specified one');
});

test('Baseline text is correctly added', function() {
    var baselines = [{value:50, label:'a baseline'}];

    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-01-01'), 'value': 100},
               {'date': new Date('2014-03-01'), 'value': 10}],
        baselines: baselines
    };

    MG.data_graphic(params);
    equal(document.querySelectorAll(params.target + ' .mg-baselines text')[0].textContent, baselines[0].label, 'Baseline text matches specified one');
});

test('When an existing chart is updated with no markers, existing markers are cleared', function() {
    var markers = [{
            'date': new Date('2014-11-02'),
            'label': 'Lorem Ipsum'
        }];

    var params_0 = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-11-01'), 'value': 12},
               {'date': new Date('2014-11-03'), 'value': 18}],
        markers: markers
    };

    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-11-01'), 'value': 14},
               {'date': new Date('2014-11-03'), 'value': 20}],
    };

    MG.data_graphic(params_0);
    MG.data_graphic(params);

    equal(document.querySelectorAll('.mg-markers').length, 0, 'Old markers were cleared');
});

test('When an existing chart is updated with no baselines, existing baselines are cleared', function() {
    var baselines = [{
            'value': 10,
            'label': 'Lorem Ipsum'
        }];

    var params_0 = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-11-01'), 'value': 12},
               {'date': new Date('2014-11-03'), 'value': 18}],
        baselines: baselines
    };

    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-11-01'), 'value': 14},
               {'date': new Date('2014-11-03'), 'value': 20}],
    };

    MG.data_graphic(params_0);
    MG.data_graphic(params);

    equal(document.querySelectorAll('.mg-baselines').length, 0, 'Old baselines were cleared');
});
