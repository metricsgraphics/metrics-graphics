module('resize');

test("Resize does not leak listeners", function () {
  // Instrument window event listener methods
  var realWindowAddEventListener = window.addEventListener;
  var realWindowRemoveEventListener = window.removeEventListener;
  var resizeListeners = [];
  
  window.addEventListener = function () {
    if (arguments[0] === 'resize' && resizeListeners.indexOf(arguments[1]) === -1) {
      resizeListeners.push(arguments[1]);
    }
    realWindowAddEventListener.apply(this, arguments);
  }

  window.removeEventListener = function () {
    if (arguments[0] === 'resize') {
      var index = resizeListeners.indexOf(arguments[1]);
      if (index !== -1) {
        resizeListeners.splice(index, 1);
      }
    }
    realWindowRemoveEventListener.apply(this, arguments);
  }
    
  var params = {
    target: '#qunit-fixture',
    full_width: true,
    data: [{'date': new Date('2014-11-01'), 'value': 12},
      {'date': new Date('2014-11-02'), 'value': 18}],
    height: 100
  };
  MG.data_graphic(params);
  var listenerCountAfterOne = resizeListeners.length;
  const REPEAT_CREATE = 20;  
  for (var i = 0; i < REPEAT_CREATE; i++) {
    MG.data_graphic(params);
  }
  equal(resizeListeners.length, listenerCountAfterOne, "Listener count constant after chart recreated " + REPEAT_CREATE + " times");

  // Restore default methods
  window.addEventListener = realWindowAddEventListener;
  window.removeEventListener = realWindowRemoveEventListener;
});
