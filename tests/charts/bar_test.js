module('Bar Chart');

var target = '#qunit-fixture',
  defaults = {
    target: target,
    chart_type: 'bar',
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

test('correct number of bars', function() {
  MG.data_graphic(defaults);
  equal($('#qunit-fixture svg .bar').length, 3, 'should have 3 bars');
});

test('triggers callbacks when provided', function() {
  var mouseoverCalled = false,
    mousemoveCalled = false,
    mouseoutCalled = false,

    params = $.extend({}, defaults, {
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

  var bar = document.getElementsByClassName('bar-rollover')[0];

  bar.dispatchEvent(generateMouseEvent('mouseover'));
  equal(mouseoverCalled, true, 'mouseover was called');

  bar.dispatchEvent(generateMouseEvent('mousemove'));
  equal(mousemoveCalled, true, 'mousemove was called');

  bar.dispatchEvent(generateMouseEvent('mouseout'));
  equal(mouseoutCalled, true, 'mouseout was called');
});

// Can be removed in 2.x
test('triggers callbacks when using 1.x-style method names', function() {
  var mouseoverCalled = false,
    mousemoveCalled = false,
    mouseoutCalled = false,

    params = $.extend({}, defaults, {
      rollover_callback: function() {
        mouseoverCalled = true;
      },
      rollout_callback: function() {
        mouseoutCalled = true;
      }
    });

  MG.data_graphic(params);

  var bar = document.getElementsByClassName('bar-rollover')[0];

  bar.dispatchEvent(generateMouseEvent('mouseover'));
  equal(mouseoverCalled, true, 'rollover_callback was called');

  bar.dispatchEvent(generateMouseEvent('mouseout'));
  equal(mouseoutCalled, true, 'rollout_callback was called');

  ok(window.deprecations.rollover_callback.warned, 'rollover_callback deprecation notice displayed');
  ok(window.deprecations.rollout_callback.warned, 'rollout_callback deprecation notice displayed');
});
