module('missing');

test('Missing chart\'s text matches specified missing_text', function() {
    var params = {
        target: '#qunit-fixture',
        chart_type: 'missing-data',
        missing_text: 'In an astral plane that was never meant to fly...'
    };

    MG.data_graphic(params);
    equal(document.querySelector('.mg-missing-text').textContent,
        params.missing_text,
        'Missing chart\'s text matches missing_text');
});
