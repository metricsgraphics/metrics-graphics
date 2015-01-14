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
    equal(document.querySelectorAll(target + ' .mg-markers line').length, markers.length, 'Two markers added');
});

test('Markers that lie outside the visible range are excluded', function() {
    var markers = [{
            'date': new Date('2014-02-01'),
            'label': '1st Milestone'
        }, {
            'date': new Date('2014-02-02'),
            'label': '2nd Milestone'
        }];

    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-02-01'), 'value': 12},
               {'date': new Date('2014-03-01'), 'value': 18}],
        markers: markers
    };

    MG.data_graphic(params);
    equal(document.querySelectorAll(target + ' .mg-markers line').length, 1, 'One marker added');
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
    equal(document.querySelectorAll(target + ' .mg-baselines line').length, markers.length, 'One baseline added');
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
    equal(document.querySelectorAll(target + ' .mg-markers text')[0].innerHTML, markers[0].label, 'First marker\'s text matches specified one');
    equal(document.querySelectorAll(target + ' .mg-markers text')[1].innerHTML, markers[1].label, 'Second marker\'s text matches specified one');
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
    equal(document.querySelectorAll(target + ' .mg-baselines text')[0].innerHTML, baselines[0].label, 'Baseline text matches specified one');
});