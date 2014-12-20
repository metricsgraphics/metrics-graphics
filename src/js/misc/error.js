//call this to add a warning icon to a graph and log an error to the console
function error(args) {
    var error = '<i class="fa fa-x fa-exclamation-circle warning"></i>';
    console.log('ERROR : ', args.target, ' : ', args.error);
    
    $(args.target).find('.mg-chart-title').append(error);
}
