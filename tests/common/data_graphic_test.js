module('data_graphic');

// Can be removed in 2.x
test('correctly aliases callbacks when using 1.x-style method names', function() {
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

  data_graphic(params);

  var bar = document.getElementsByClassName('bar-rollover')[0];

  bar.dispatchEvent(generateMouseEvent('mouseover'));
  equal(mouseoverCalled, true, 'rollover_callback was called');

  bar.dispatchEvent(generateMouseEvent('mouseout'));
  equal(mouseoutCalled, true, 'rollout_callback was called');

  ok(window.deprecations.rollover_callback.warned, 'rollover_callback deprecation notice displayed');
  ok(window.deprecations.rollout_callback.warned, 'rollout_callback deprecation notice displayed');
});
