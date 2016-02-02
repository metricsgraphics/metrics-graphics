var bound_window_resize_listener;
var that = this;

var window_resize_listener = function window_resize_listener(args) {
  var svg = d3.select(args.target).select('svg');

  var aspect = svg.attr('width') !== 0
      ? (svg.attr('height') / svg.attr('width'))
      : 0;

  var newWidth = get_width(args.target);

  svg.attr('width', newWidth);
  svg.attr('height', aspect * newWidth);
};

MG.remove_window_listeners = function mg_remove_window_listeners() {
  window.removeEventListener('resize', bound_window_resize_listener, false);
};

function mg_window_listeners(args) {
  mg_if_aspect_ratio_resize_svg(args);
}

function mg_if_aspect_ratio_resize_svg(args) {
  // have we asked the svg to fill a div, if so resize with div
  if (args.full_width || args.full_height) {
    bound_window_resize_listener = window_resize_listener.bind(that, args);
    window.addEventListener('resize', bound_window_resize_listener, false);
  }
}
