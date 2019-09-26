function MG_WindowResizeTracker() {
  var targets = [];

  var Observer;
  if (typeof MutationObserver !== "undefined") {
    Observer = MutationObserver;
  } else if (typeof WebKitMutationObserver !== "undefined") {
    Observer = WebKitMutationObserver;
  }

  function window_listener() {
    targets.forEach(function(target) {
      var svg = d3.select(target).select('svg');

      // skip if svg is not visible
      if (!svg.empty() && (svg.node().parentNode.offsetWidth > 0 || svg.node().parentNode.offsetHeight > 0)) {
        var aspect = svg.attr('width') !== 0 ? (svg.attr('height') / svg.attr('width')) : 0;

        var newWidth = get_width(target);

        svg.attr('width', newWidth);
        svg.attr('height', aspect * newWidth);
      }
    });
  }

  function remove_target(target) {
    var index = targets.indexOf(target);
    if (index !== -1) {
      targets.splice(index, 1);
    }

    if (targets.length === 0) {
      window.removeEventListener('resize', window_listener, true);
    }
  }

  return {
    add_target: function(target) {
      if (targets.length === 0) {
        window.addEventListener('resize', window_listener, true);
      }

      if (targets.indexOf(target) === -1) {
        targets.push(target);

        if (Observer) {
          var observer = new Observer(function(mutations) {
            var targetNode = d3.select(target).node();

            if (!targetNode || mutations.some(
                function(mutation) {
                  for (var i = 0; i < mutation.removedNodes.length; i++) {
                    if (mutation.removedNodes[i] === targetNode) {
                      return true;
                    }
                  }
                })) {
              observer.disconnect();
              remove_target(target);
            }
          });

          observer.observe(d3.select(target).node().parentNode, { childList: true });
        }
      }
    }
  };
}

var mg_window_resize_tracker = new MG_WindowResizeTracker();

function mg_window_listeners(args) {
  mg_if_aspect_ratio_resize_svg(args);
}

function mg_if_aspect_ratio_resize_svg(args) {
  // have we asked the svg to fill a div, if so resize with div
  if (args.full_width || args.full_height) {
    mg_window_resize_tracker.add_target(args.target);
  }
}
