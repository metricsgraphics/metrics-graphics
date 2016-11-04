function use_virtual_element(fn, jsdom_instance) {
  var jsdom = jsdom_instance || jsdom;
  if (typeof jsdom === 'undefined') {
    (console.error || console.log)('jsdom could not be found.');
    return;
  }

  var global_scope = typeof window === 'undefined' ? global : window;
  var virtual_element_id = 'virtual_elem';

  // inspired by: https://bl.ocks.org/tomgp/c99a699587b5c5465228
  jsdom.env({
    html: '',
    features: { QuerySelector: true },
    done: function(err, virtual_window) {
      if (err) {
        throw err;
      }

      var virtual_d3 = d3.select(virtual_window.document);
      virtual_d3.select('body').append('div').attr('id', virtual_element_id);

      var original_d3 = d3;
      var original_window = global_scope.window;
      var original_document = global_scope.document;
      global_scope.d3 = virtual_d3;
      global_scope.window = virtual_window;
      global_scope.document = virtual_window.document;

      var target = '#' + virtual_element_id;
      function get_markup() {
        return virtual_d3.select(target).html();
      }
      fn(target, get_markup);

      global_scope.d3 = original_d3;
      global_scope.window = original_window;
      global_scope.document = original_document;
    }
  });
}

MG.use_virtual_element = use_virtual_element;
