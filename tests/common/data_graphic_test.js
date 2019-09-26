module('data_graphic');

test('Required arguments are set', function() {
    var params = {
        target: '#qunit-fixture',
        data: [{'date': new Date('2014-11-01'), 'value': 12},
               {'date': new Date('2014-11-02'), 'value': 18}]
    };

    MG.data_graphic(params);

    ok(params.width, 'args.width is set');
    ok(params.height, 'args.height is set');
    ok(params.data, 'args.data is set');
    ok(params.target, 'args.target is set');
});

test('Dom element works as target', function() {
    var params = {
        target: document.getElementById('qunit-fixture'),
        data: [{'date': new Date('2014-11-01'), 'value': 12},
               {'date': new Date('2014-11-02'), 'value': 18}]
    };

    MG.data_graphic(params);

    ok(document.querySelector('#qunit-fixture svg') != null, 'passing in dom element works properly');
});

// Can be removed in 2.x
test('Correctly aliases callbacks when using 1.x-style method names', function() {
  var mouseoverCalled = false,
    mouseoutCalled = false,

    params = {
      target: '#qunit-fixture',
      data: [{value: 1, label: 'One'}],
      chart_type: 'bar',
      rollover_callback: function() {
        mouseoverCalled = true;
      },
      rollout_callback: function() {
        mouseoutCalled = true;
      }
    };

  MG.data_graphic(params);

  var bar = document.getElementsByClassName('mg-bar-rollover')[0];

  bar.dispatchEvent(generateMouseEvent('mouseover'));
  equal(mouseoverCalled, true, 'rollover_callback was called');

  bar.dispatchEvent(generateMouseEvent('mouseout'));
  equal(mouseoutCalled, true, 'rollout_callback was called');

  ok(MG.deprecations.rollover_callback.warned, 'rollover_callback deprecation notice displayed');
  ok(MG.deprecations.rollout_callback.warned, 'rollout_callback deprecation notice displayed');
});
