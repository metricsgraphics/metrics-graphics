function mg_window_listeners(args) {
    mg_if_aspect_ratio_resize_svg(args);
}

function mg_if_aspect_ratio_resize_svg(args) {
    //have we asked the svg to fill a div, if so resize with div
    if (args.full_width || args.full_height) {
        window.addEventListener('resize', function() {
            var svg = d3.select(args.target).select('svg');
            var aspect = svg.attr('height') / svg.attr('width');
            var newWidth = get_width(args.target);

            svg.attr('width', newWidth);
            svg.attr('height', aspect * newWidth);
        }, true);
    }
}
