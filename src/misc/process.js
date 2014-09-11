function raw_data_transformation(args){
    //do we need to turn json data to 2d array?

    if(!$.isArray(args.data[0]))
        args.data = [args.data];
    //

    if ($.isArray(args.y_accessor)){
        args.data = args.data.map(function(_d){
            return args.y_accessor.map(function(ya){
                return _d.map(function(di){
                    di = clone(di);
                    di['multiline_y_accessor'] = di[ya];
                    return di;
                })
            })
        })[0];
        args.y_accessor = 'multiline_y_accessor';
    }

    //sort x-axis data.
    if (args.chart_type == 'line'){
        for(var i=0; i<args.data.length; i++) {
            args.data[i].sort(function(a, b) {
                return a[args.x_accessor] - b[args.x_accessor];
            });
        }
    }
    return this
}

function process_line(args){
    return this;
}

function process_histogram(args){
    // if args.binned=False, then we need to bin the data appropriately.
    // if args.binned=True, then we need to make sure to compute the relevant computed data.
    // the outcome of either of these should be something in args.computed_data.
    // the histogram plotting function will be looking there for the data to plot.

    // we need to compute an array of objects.
    // each object has an x, y, and dx.

    // histogram data is always single dimension
    var our_data = args.data[0];
    var extracted_data;
    if (args.binned==false){
        // use d3's built-in layout.histogram functionality to compute what you need.

        if (typeof(our_data[0]) == 'object'){
            // we are dealing with an array of objects. Extract the data value of interest.
            extracted_data = our_data
                .map(function(d){ 
                    return d[args.x_accessor];
                });
        } else if (typeof(our_data[0]) == 'number'){
            // we are dealing with a simple array of numbers. No extraction needed.
            extracted_data = our_data;
        } 
        else {
            console.log('TypeError: expected an array of numbers, found ' + typeof(our_data[0]));
            return;
        }

        var hist = d3.layout.histogram()
        if (args.bins){
            hist = hist.bins(args.bins);
        }
        args.processed_data = hist(extracted_data)
            .map(function(d){
                // extract only the data we need per data point.
                return {'x': d['x'], 'y':d['y'], 'dx': d['dx']};
            })
    } else {
        // here, we just need to reconstruct the array of objects
        // take the x accessor and y accessor.
        // pull the data as x and y. y is count.

        args.processed_data = our_data.map(function(d){
            return {'x': d[args.x_accessor], 'y': d[args.y_accessor]}
        });
        var this_pt;
        var next_pt;
        // we still need to compute the dx component for each data point
        for (var i=0; i < args.processed_data.length; i++){
            this_pt = args.processed_data[i];
            if (i == args.processed_data.length-1){
                this_pt.dx = args.processed_data[i-1].dx;
            } else {
                next_pt = args.processed_data[i+1];
                this_pt.dx = next_pt.x - this_pt.x;
            }
        }
    }
    args.data = [args.processed_data];
    args.x_accessor = args.processed_x_accessor;
    args.y_accessor = args.processed_y_accessor;
    return this;
}

function process_categorical_variables(args){
    // For use with bar charts, etc.

    var extracted_data, processed_data={}, pd=[];
    var our_data = args.data[0];
    args.categorical_variables = [];

    if (args.binned == false){
        if (typeof(our_data[0]) == 'object') {
            // we are dealing with an array of objects. Extract the data value of interest.
            extracted_data = our_data
                .map(function(d){ 
                    return d[args.y_accessor];
                });
        } else {
            extracted_data = our_data;
        }
        var this_dp;
        for (var i=0; i< extracted_data.length; i++){
            this_dp=extracted_data[i];
            if (args.categorical_variables.indexOf(this_dp) == -1) args.categorical_variables.push(this_dp)
            if (!processed_data.hasOwnProperty(this_dp)) processed_data[this_dp]=0;
            
            processed_data[this_dp]+=1;
        }
        processed_data = Object.keys(processed_data).map(function(d){
            var obj = {};
            obj[args.x_accessor] = processed_data[d];
            obj[args.y_accessor] = d;
            return obj;
        })
    } else {
        // nothing needs to really happen here.
        processed_data = our_data;
    }
    args.data = [processed_data];
    return this;
}

function process_point(args){

    var data = args.data[0];
    var x = data.map(function(d){return d[args.x_accessor]});
    var y = data.map(function(d){return d[args.y_accessor]});
    if (args.least_squares){
        args.ls_line = least_squares(x,y);    
    }
    
    //args.lowess_line = lowess_robust(x,y, .5, 100)
    return this;

}
