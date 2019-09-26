module('process');

test('args.missing_is_zero doesn\'t throw a "args.data[0][0] is undefined" error', function() {
    var data = [{"date": new Date('2014-02-02'), "value": 6}];
    var params = {
        data: data,
        target: "#qunit-fixture",
        missing_is_zero: true
    };

    MG.data_graphic(params);

    equal(params.data.length, 1, 'args.data is defined');
});