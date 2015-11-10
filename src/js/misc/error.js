// call this to add a warning icon to a graph and log an error to the console
function error (args) {
  console.log('ERROR : ', args.target, ' : ', args.error);

  d3.select(args.target).select('.mg-chart-title')
    .append('i')
    .attr('class', 'fa fa-x fa-exclamation-circle warning');
}

function internal_error (args) {
  console.log('INTERNAL ERROR : ', args.target, ' : ', args.internal_error);
}

MG.error = error;
