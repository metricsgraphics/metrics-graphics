// influenced by https://bl.ocks.org/tomgp/c99a699587b5c5465228

function render_markup_for_server(callback) {
  var virtual_window = MG.virtual_window;
  var virtual_d3 = d3.select(virtual_window.document);
  var target = virtual_window.document.createElement('div');

  var original_d3 = global.d3;
  var original_window = global.window;
  var original_document = global.document;
  global.d3 = virtual_d3;
  global.window = virtual_window;
  global.document = virtual_window.document;

  var error;
  try {
    callback(target);
  } catch(e) {
    error = e;
  }

  global.d3 = original_d3;
  global.window = original_window;
  global.document = original_document;

  if (error) {
    throw error;
  }

  /* for some reason d3.select parses jsdom elements incorrectly
   * but it works if we wrap the element in a function.
   */
  return virtual_d3.select(function targetFn() {
    return target;
  }).html();
}

function render_markup_for_client(callback) {
  var target = document.createElement('div');
  callback(target);
  return d3.select(target).html();
}

function render_markup(callback) {
  switch(typeof window) {
    case 'undefined':
      return render_markup_for_server(callback);
    default:
      return render_markup_for_client(callback);
  }
}

function init_virtual_window(jsdom, force) {
  if (MG.virtual_window && !force) {
    return;
  }

  var doc = jsdom.jsdom({
    html: '',
    features: { QuerySelector: true }
  });
  MG.virtual_window = doc.defaultView;
}

MG.render_markup = render_markup;
MG.init_virtual_window = init_virtual_window;
