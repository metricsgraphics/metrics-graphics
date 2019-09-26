function generateMouseEvent(type) {
  var event = document.createEvent('MouseEvent');
  event.initEvent(type, true, true);
  return event;
}

// essentially the same as $.extend
function extend(){
  var result = {},
    $__arguments = [].slice.call(arguments);

  $__arguments.forEach(function(obj) {
    for (var prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        result[prop] = obj[prop];
      }
    }
  });
  return result;
}
