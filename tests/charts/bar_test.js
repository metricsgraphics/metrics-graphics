module('Bar Chart');

test('correct number of bars', function() {
  data_graphic({
    target: '#qunit-fixture',
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
  });

  equal($('#qunit-fixture svg .bar').length, 3, 'should have 3 bars');
});
