module('xAxis')

test('X-axis is added', function () {
  var params = {
    target: '#qunit-fixture',
    data: [{ date: new Date('2014-01-01'), value: 12 },
      { date: new Date('2014-03-01'), value: 18 }]
  }

  MG.data_graphic(params)
  ok(document.querySelector('.mg-x-axis'), 'X-axis is added')
})

test('args.xAxis set to false', function () {
  var params = {
    target: '#qunit-fixture',
    data: [{ date: new Date('2014-01-01'), value: 12 },
      { date: new Date('2014-03-01'), value: 18 }],
    xAxis: false
  }

  MG.data_graphic(params)
  equal(document.querySelector('.mg-x-axis'), null, 'X-axis is not added')
})

test('Only one x-axis is added on multiple calls to the same target element', function () {
  var params = {
    target: '#qunit-fixture',
    data: [{ date: new Date('2014-01-01'), value: 12 },
      { date: new Date('2014-03-01'), value: 18 }]
  }

  MG.data_graphic(params)
  MG.data_graphic(MG.clone(params))

  equal(document.querySelectorAll(params.target + ' .mg-x-axis').length, 1, 'We only have one x-axis')
})

test('args.showSecondaryXLabel: true', function () {
  var params = {
    target: '#qunit-fixture',
    data: [{ date: new Date('2014-01-01'), value: 12 },
      { date: new Date('2014-03-01'), value: 18 }]
  }

  MG.data_graphic(params)
  ok(document.querySelector('.mg-year-marker'), 'Year marker exists')
})

test('args.showSecondaryXLabel: false', function () {
  var params = {
    target: '#qunit-fixture',
    data: [{ date: new Date('2014-01-01'), value: 12 },
      { date: new Date('2014-03-01'), value: 18 }],
    showSecondaryXLabel: false
  }

  MG.data_graphic(params)
  equal(document.querySelector('.mg-year-marker'), null, 'Year marker not added')
})

test('args.xLabel', function () {
  var params = {
    target: '#qunit-fixture',
    data: [{ date: new Date('2014-01-01'), value: 12 },
      { date: new Date('2014-03-01'), value: 18 }],
    xLabel: 'foo bar'
  }

  MG.data_graphic(params)
  ok(document.querySelector('.mg-x-axis .label'), 'X-axis label exists')
})

test('args.labels (scatter plot)', function () {
  var params = {
    target: '#qunit-fixture',
    data: [{ date: new Date('2014-01-01'), value: 12 },
      { date: new Date('2014-03-01'), value: 18 }],
    xLabel: 'foo bar',
    yLabel: 'bar foo',
    chartType: 'point'
  }

  MG.data_graphic(params)
  ok(document.querySelector('.mg-x-axis .label'), 'X-axis label exists')
  ok(document.querySelector('.mg-y-axis .label'), 'Y-axis label exists')
})

test('X-axis doesn\'t break when data object is of length 1', function () {
  var params = {
    target: '#qunit-fixture',
    data: [{ date: new Date('2014-01-01'), value: 12 }]
  }

  MG.data_graphic(params)
  ok(document.querySelector('.mg-x-axis'), 'X-axis exists')
})

test('args.xRug', function () {
  var params = {
    target: '#qunit-fixture',
    data: [{ date: new Date('2014-01-01'), value: 12 },
      { date: new Date('2014-03-01'), value: 18 }],
    xRug: true
  }

  MG.data_graphic(params)
  ok(document.querySelector('.mg-x-rug'), 'X-axis rugplot exists')
})

test('Only one rugplot is added on multiple calls to the same target element', function () {
  var params = {
    target: '#qunit-fixture',
    data: [{ date: new Date('2014-01-01'), value: 12 },
      { date: new Date('2014-03-01'), value: 18 }],
    xRug: true
  }

  MG.data_graphic(params)
  MG.data_graphic(MG.clone(params))

  equal(document.querySelectorAll('.mg-x-rug').length, 2, 'We only have one rugplot on the x-axis')
})

test('args.xExtendedTicks', function () {
  var params = {
    target: '#qunit-fixture',
    data: [{ date: new Date('2014-01-01'), value: 12 },
      { date: new Date('2014-03-01'), value: 18 }],
    xExtendedTicks: true
  }

  MG.data_graphic(params)
  ok(document.querySelector('.mg-extended-xax-ticks'), 'X-axis extended ticks exist')
})

test('Correctly calculates min and max values for line, point and histogram charts', function () {
  // single series
  var params = {
    target: '#qunit-fixture',
    xAccessor: 'x',
    yAccessor: 'y',
    data: [
      [
        { x: 4, y: 5 },
        { x: 5, y: 5 },
        { x: 6, y: 5 },
        { x: 7, y: 5 }
      ]
    ]
  }
  MG.data_graphic(params)
  equal(params.processed.minX, 4, 'min is correct for single series')
  equal(params.processed.maxX, 7, 'max is correct for single series')

  // multiple series
  var params2 = {
    target: '#qunit-fixture',
    xAccessor: 'x',
    yAccessor: 'y',
    data: [
      [
        { x: 1, y: 5 },
        { x: 2, y: 5 },
        { x: 3, y: 5 },
        { x: 4, y: 5 }
      ], [
        { x: 5, y: 5 },
        { x: 6, y: 5 },
        { x: 7, y: 5 }
      ]
    ]
  }
  MG.data_graphic(params2)
  equal(params2.processed.minX, 1, 'min is correct for multiple series')
  equal(params2.processed.maxX, 7, 'max is correct for multiple series')
})

/* test('Correctly calculates min and max values for bar chart', function() {
    var args;

    // single series
    args = {
        xAccessor: 'x',
        baselineAccessor: 'b',
        predictorAccessor: 'p',
        chartType: 'bar',
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
    equal(args.processed.minX, 0, 'min is correct');
    equal(args.processed.maxX, 12, 'max is correct');
}); */

test('Ensure that custom xaxFormat isn\'t deleted', function () {
  var params = {
    title: 'foo',
    target: '.result',
    xaxFormat: function (d) { return 'humbug' },
    data: [{ date: new Date('2014-01-01'), value: 12 },
      { date: new Date('2014-03-01'), value: 18 }]
  }

  MG.data_graphic(params)
  equal(params.xaxFormat(), 'humbug', 'xaxFormat hasn\'t been overriden')
})

test('Ensure that default null xaxFormat is respected; allow MG to recalculate the default on redraw', function () {
  var params = {
    title: 'foo',
    target: '.result',
    xaxFormat: null,
    data: [{ date: new Date('2014-01-01'), value: 12 },
      { date: new Date('2014-03-01'), value: 18 }]
  }

  MG.data_graphic(params)
  equal(params.xaxFormat, null, 'xaxFormat is still null')
})
