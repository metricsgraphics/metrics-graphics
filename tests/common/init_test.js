module('init');

test('MG properly detects time series vs. not.', function () {
  var params1 = {
    target: '#qunit-fixture',
    data: [{'date': new Date('2014-11-01'), 'value': 12},
      {'date': new Date('2014-11-02'), 'value': 18}],
    x_accessor: 'date'
  };

  var params2 = {
    target: '#qunit-fixture',
    data: [{'date': 5434, 'value': 12},
      {'date': 5435, 'value': 18}],
    x_accessor: 'date'
  };

  var params3 = {
    target: '#qunit-fixture',
    data: [[{'date': new Date('2014-11-01'), 'value': 12},
      {'date': new Date('2014-11-02'), 'value': 18}],
      [{'date': new Date('2014-11-01'), 'value': 32},
        {'date': new Date('2014-11-02'), 'value': 43}]],
    x_accessor: 'date'
  };
  mg_merge_args_with_defaults(params1);
  mg_merge_args_with_defaults(params2);
  mg_merge_args_with_defaults(params3);
  mg_is_time_series(params1);
  mg_is_time_series(params2);
  mg_is_time_series(params3);

  ok(params1.time_series === true, 'Date-accessed data set is a time series.');
  ok(params2.time_series === false, 'Number-accessed data set is not a time series.');
  ok(params3.time_series === true, 'Nested data set w/ dates detected as time series.');
});

test("Chart's width is set correctly on subsequent calls to existing chart", function () {
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

  var width = document.querySelector(params.target + ' svg').clientWidth;
  ok(width === 200, "SVG's width matches latest specified width");
});

test("Chart's width is set to parents if full_width: true", function () {
  var params = {
    target: '#qunit-fixture',
    full_width: true,
    data: [{'date': new Date('2014-11-01'), 'value': 12},
      {'date': new Date('2014-11-02'), 'value': 18}],
    height: 100
  };
  MG.data_graphic(params);

  var svg_width = document.querySelector(params.target + ' svg').clientWidth;
  var div_width = document.querySelector(params.target).clientWidth;

  equal(div_width, svg_width, "SVG's width matches parent upon using full_width: true");
});

test("Chart's height is set to parents if full_height: true", function () {
  var params = {
    target: '#qunit-fixture',
    full_height: true,
    data: [{'date': new Date('2014-11-01'), 'value': 12},
      {'date': new Date('2014-11-02'), 'value': 18}],
    width: 500
  };

  document.querySelector(params.target).style.height = '500px';
  MG.data_graphic(params);

  var svg_height = document.querySelector(params.target + ' svg').clientHeight;
  var div_height = document.querySelector(params.target).clientHeight;

  equal(div_height, svg_height, "SVG's height matches parent upon using full_height: true");
});

test("Won't add SVG element if an SVG element already exists in parent.", function () {
  var args1 = {
    target: '#qunit-fixture div#exists',
    width: 500,
    height: 200,
    linked: false,
    svg: 'FLAG'
  };

  var qunit = document.querySelector('#qunit-fixture');
  var div = document.createElement('div');
  div.id = 'exists';
  div.appendChild(document.createElement('svg'));
  qunit.appendChild(div);
  var first_number = document.querySelectorAll('svg').length;
  mg_add_svg_if_it_doesnt_exist('', args1);
  var second_number = document.querySelectorAll('svg').length;
  equal(first_number, second_number, 'SVG element not added if it already exists.');
});

test("Chart's height is set correctly on subsequent calls to existing chart", function () {
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

  var height = document.querySelector(params.target + ' svg').clientHeight;
  ok(height == params.height, "SVG's height matches latest specified height");
});

test('Charts are plotted correctly when MG is called multiple times on the same target element', function () {
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

  // ensure chart types change appropriately
  var line = document.querySelector('.mg-main-line');
  ok(line, 'chart_type is `line`, line chart is plotted');

  // check all the other chart types
  var chart_types = [{id: 'point', domElement: '.mg-points'},
    {id: 'histogram', domElement: '.mg-histogram'},
    {id: 'bar', domElement: '.mg-barplot'}];

  for (var i = 0; i < chart_types.length; i++) {
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

    // ensure old chart was removed
    equal(document.querySelectorAll('.mg-main-line').length, 0, 'line chart (old one) was removed');
  }
});

test('Missing chart has required class name set', function () {
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

test('Linked chart has the required class set', function () {
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

test('args.time_series is set to true when data is time-series', function () {
  var params = {
    target: '#qunit-fixture',
    data: [{'foo': new Date('2014-11-01'), 'value': 12},
      {'foo': new Date('2014-11-02'), 'value': 18}],
    x_accessor: 'foo'
  };

  MG.data_graphic(params);
  ok(params.time_series, 'args.time_series is set to true when data is time-series');
});

test('args.time_series is set to false when data is not time-series', function () {
  var params = {
    target: '#qunit-fixture',
    data: [{'foo': 100, 'value': 12},
      {'foo': 200, 'value': 18}],
    x_accessor: 'foo'
  };

  MG.data_graphic(params);
  equal(params.time_series, false, 'args.time_series is set to false when data is not time-series');
});

test('Only one clip path is added on multiple calls to the same target element', function () {
  var params = {
    target: '#qunit-fixture',
    data: [{'date': new Date('2014-01-01'), 'value': 12, 'l': 10, 'u': 14},
      {'date': new Date('2014-03-01'), 'value': 18, 'l': 16, 'u': 20}]
  };

  MG.data_graphic(params);
  MG.data_graphic(MG.clone(params));

  equal(document.querySelectorAll('.mg-clip-path').length, 1, 'We only have one clip path');
});
