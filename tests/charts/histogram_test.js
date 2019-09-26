module('histogram');


// THIS TEST NEEDS TO BE REWRITTEN AS A RESULT OF #614
// test('A solitary active datapoint exists', function() {
//      var params = {
//         target: '#qunit-fixture',
//         data: d3.range(10000).map(d3.random.bates(10)),
//         chart_type: 'histogram',
//         linked: true
//     };

//     MG.data_graphic(params);
//     equal(document.querySelectorAll('.mg-active-datapoint').length, 1, 'One active datapoint exists');
// });

test('Rollovers exist', function() {
     var params = {
        target: '#qunit-fixture',
        data: d3.range(10000).map(d3.randomBates(10)),
        chart_type: 'histogram',
        linked: true
    };

    MG.data_graphic(params);
    ok(document.querySelector('.mg-rollover-rect'), 'Rollovers exist');
});

test('We have only one set of rollovers', function() {
     var params = {
        target: '#qunit-fixture',
        data: d3.range(10000).map(d3.randomBates(10)),
        chart_type: 'histogram',
        linked: true
    };

    MG.data_graphic(params);
    equal(document.querySelectorAll('.mg-rollover-rect').length, 1, 'One set of rollovers exists');
});

test('Linked chart has the required class set', function() {
     var params = {
        target: '#qunit-fixture',
        data: d3.range(10000).map(d3.randomBates(10)),
        chart_type: 'histogram',
        linked: true
    };

    MG.data_graphic(params);
    var matches = document.querySelector(params.target + ' svg').getAttribute('class').match(/linked/);
    ok(matches, 'Linked chart has class `linked` set');
});

test('Histogram exists', function() {
    var params = {
        target: '#qunit-fixture',
        data: d3.range(10000).map(d3.randomBates(10)),
        chart_type: 'histogram',
        linked: true
    };

    MG.data_graphic(params);
    ok(document.querySelector('.mg-histogram'), 'Histogram exists');
});
