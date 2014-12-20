module('Utility Functions');


////////////////////////////////////////////////////
//              Ch. 1 - MG.convert.               //
////////////////////////////////////////////////////

var datapoint1 = [{date: '2014-03-01', value: 6}];
var datapoint2 = [{date: 232243442, value: 6}];

test('Date works as intended', function() {
  var transformed = MG.convert.date(datapoint1, 'date');
  var out = d3.time.format('%Y-%m-%d')('2014-03-01');
  equal(datapoint[0].date, out, 'both values should be new Date obj set at 2014-03-01');
});

test('custom date', function() {
  var transformed = MG.convert.date(datapoint1, 'date', '%m-%d');
  var out = d3.time.format('%m-%d')('2014-03-01');
  equal(datapoint[0].date, out, 'both values should be new Date obj set at 2014-03-01');
});

test('invalid date', function() {
  var transformed = MG.convert.date(datapoint1, 'date', '%m-%d');
  var out = d3.time.format('%m-%d')('2014-03-01');
  equal(datapoint[0].date, out, 'both values should be new Date obj set at 2014-03-01');
});

