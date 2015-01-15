function mg_window_listeners(args){
	mg_if_aspect_ratio_resize_svg(args);
}

function mg_if_aspect_ratio_resize_svg(args){
	// If we've asked the svg to fill a div, resize with div.
	if (args.full_width || args.full_height){
		window.addEventListener('resize', function(){
			// var svg_width = 
			// var svg_height = 
			// args.width = svg_width;
			// args.height = svg_height;
			d3.select(args.target).select('svg')
        		.attr('width', get_width(args.target));
		}, true);
	}

}