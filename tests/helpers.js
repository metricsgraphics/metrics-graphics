function generateMouseEvent(type) {
  var event = document.createEvent('MouseEvent');
  event.initEvent(type, true, true);
  return event;
}

// essentially the same as $.extend
function extend(a, b){
  var c = {};
  for(var p in a)    c[p] = (b[p] == null) ? a[p] : b[p];
  return c;
}
