module('utility');

test('MG.convert.date', function() {
    var data = [{'date': '2014-01-01', 'value': 12},
               {'date': '2014-03-01', 'value': 18}];
    
    MG.convert.date(data, 'date');
    equal($.type(data[0].date), 'date', 'First date is of type date');
    equal($.type(data[0].date), 'date', 'Second date is of type date');
});

test('MG.convert.date with an alternative timestamp style', function() {
    var data = [{'date': '2014-20-12', 'value': 12},
               {'date': '2014-21-12', 'value': 18}];
    
    MG.convert.date(data, 'date', '%Y-%d-%m');
    equal($.type(data[0].date), 'date', 'First date is of type date');
    equal($.type(data[0].date), 'date', 'Second date is of type date');
});

test('MG.convert.number', function() {
    var data = [{'date': '2014-20-12', 'value': '12'},
               {'date': '2014-21-12', 'value': '18'}];
    
    MG.convert.number(data, 'value');
    equal($.type(data[0].value), 'number', 'First value is a number');
    equal($.type(data[0].value), 'number', 'Second value is a number');
});


module('Utility Functions');


////////////////////////////////////////////////////
//              Ch. 1 - MG.convert.               //
////////////////////////////////////////////////////

/*var datapoint1 = [{date: '2014-03-01', value: 6}];
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
*/
