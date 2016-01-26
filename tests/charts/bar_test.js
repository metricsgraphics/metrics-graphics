var target = '#qunit-fixture',
  defaults;

module('bar', {
  setup: function() {
    defaults = {
        target: target,
        chart_type: 'bar',
        x_accessor: 'value',
        y_accessor: 'label',
        transition_on_update: false,
        data: [{
            label: 'Bar 1',
            value: 100
        },{
            label: 'Bar 2',
            value: 200
        },{
            label: 'Bar 3',
            value: 300
        }]
    };
  }
});

test('Correct number of bars are added', function() {
    expect(1);
    MG.data_graphic(defaults);
    equal(document.querySelectorAll('.mg-bar').length, 3, 'Should have 3 bars');
});

test('Triggers callbacks when provided', function() {
    var mouseoverCalled = false,
        mousemoveCalled = false,
        mouseoutCalled = false,

    params = extend(defaults, {
        mouseover: function() {
            mouseoverCalled = true;
        },
        mousemove: function() {
            mousemoveCalled = true;
        },
        mouseout: function() {
            mouseoutCalled = true;
        }
    });

    MG.data_graphic(params);

    var bar = document.getElementsByClassName('mg-bar-rollover')[0];

    bar.dispatchEvent(generateMouseEvent('mouseover'));
    equal(mouseoverCalled, true, 'mouseover was called');

    bar.dispatchEvent(generateMouseEvent('mousemove'));
    equal(mousemoveCalled, true, 'mousemove was called');

    bar.dispatchEvent(generateMouseEvent('mouseout'));
    equal(mouseoutCalled, true, 'mouseout was called');
});

// test('When updating', function() {
//     var bars = [{
//             label: 'Bar 1',
//             value: 100,
//             predictor: 75,
//             baseline: 50
//         }];

//     var params = extend(defaults, {
//         data: bars,
//         height: 100,
//         width: 300,
//         orientation: 'vertical',
//         predictor_accessor: 'predictor',
//         baseline_accessor: 'baseline',
//         animate_on_load: false,
//         transition_on_update: false
//     });

//     MG.data_graphic(params);
//     equal(164, d3.select(target).select('.mg-barplot .mg-bar').attr('width'), 'initial bar size is correct');
//     equal(123, d3.select(target).select('.mg-barplot .mg-bar-prediction').attr('width'), 'initial predictor size is correct');
//     equal(160, d3.select(target).select('.mg-barplot .mg-bar-baseline').attr('x1'), 'initial baseline position is correct');

//     params.data[0][0].value = 50;
//     params.data[0][0].predictor = 100;
//     params.data[0][0].baseline = 75;

//     MG.data_graphic(params);
//     equal(82, d3.select(target).select('.mg-barplot .mg-bar').attr('width'), 'the bars are redrawn with correct sizes');
//     equal(164, d3.select(target).select('.mg-barplot .mg-bar-prediction').attr('width'), 'the predictors are redrawn with correct sizes');
//     equal(201, d3.select(target).select('.mg-barplot .mg-bar-baseline').attr('x1'), 'the baseline is redrawn in the correct position');
// });
