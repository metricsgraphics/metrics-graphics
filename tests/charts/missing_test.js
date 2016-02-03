module('missing');

if (!Function.prototype.bind) {
  Function.prototype.bind = function(oThis) {
    if (typeof this !== 'function') {
      // closest thing possible to the ECMAScript 5
      // internal IsCallable function
      throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
    }

    var aArgs   = Array.prototype.slice.call(arguments, 1),
        fToBind = this,
        fNOP    = function() {},
        fBound  = function() {
          return fToBind.apply(this instanceof fNOP
                 ? this
                 : oThis,
                 aArgs.concat(Array.prototype.slice.call(arguments)));
        };

    if (this.prototype) {
      // Function.prototype don't have a prototype property
      fNOP.prototype = this.prototype;
    }
    fBound.prototype = new fNOP();

    return fBound;
  };
}

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

test('Only one mg-missing-pane on multiple calls to the same target element', function() {
    var params = {
        target: '#qunit-fixture',
        chart_type: 'missing-data',
        missing_text: 'In an astral plane that was never meant to fly...'
    };

    MG.data_graphic(params);
    MG.data_graphic(MG.clone(params));

    equal(document.querySelectorAll(params.target + ' .mg-missing-pane').length, 1, 'We only have one mg-missing-pane');
});

test('Only one mg-missing-text on multiple calls to the same target element', function() {
    var params = {
        target: '#qunit-fixture',
        chart_type: 'missing-data',
        missing_text: 'In an astral plane that was never meant to fly...'
    };

    MG.data_graphic(params);
    MG.data_graphic(MG.clone(params));

    equal(document.querySelectorAll(params.target + ' .mg-missing-text').length, 1, 'We only have one mg-missing-text');
});

test('missing chart obeys full_width: true', function() {
    var params = {
        target: '#qunit-fixture',
        chart_type: 'missing-data',
        full_width: true,
        missing_text: 'In an astral plane that was never meant to fly...'
    };
    document.querySelector('#qunit-fixture').style.width='700px';

    MG.data_graphic(params);

    equal(document.querySelector('#qunit-fixture svg').getAttribute('width'), 700, 'The missing chart svg has same width as parent element.');
});

test('missing chart obeys full_height: true', function() {
    var params = {
        target: '#qunit-fixture',
        chart_type: 'missing-data',
        full_height: true,
        missing_text: 'In an astral plane that was never meant to fly...'
    };
    document.querySelector('#qunit-fixture').style.height='700px';

    MG.data_graphic(params);

    equal(document.querySelector('#qunit-fixture svg').getAttribute('height'), 700, 'The missing chart svg has same width as parent element.');
});

test('Missing chart\'s width is set correctly on subsequent calls to existing chart', function() {
    var params_0 = {
        target: '#qunit-fixture',
        chart_type: 'missing-data',
        missing_text: 'In an astral plane that was never meant to fly...'
    };

    var params = {
        target: '#qunit-fixture',
        chart_type: 'missing-data',
        missing_text: 'In an astral plane that was never meant to fly...',
        width: 200,
        height: 100,
    };

    MG.data_graphic(params_0);
    MG.data_graphic(params);

    var width = document.querySelector(params.target + ' svg').offsetWidth;
    ok(width == 200, 'SVG\'s width matches latest specified width');
});
