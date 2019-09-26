// call this to add a warning icon to a graph and log an error to the console
function error(args) {
  console.error('ERROR : ', args.target, ' : ', args.error);

  d3.select(args.target).select('.mg-chart-title')
    .append('tspan')
      .attr('class', 'fa fa-x fa-exclamation-circle mg-warning')
      .attr('dx', '0.3em')
      .text('\uf06a');
}

function internal_error(args) {
  console.error('INTERNAL ERROR : ', args.target, ' : ', args.internal_error);
}

MG.error = error;
