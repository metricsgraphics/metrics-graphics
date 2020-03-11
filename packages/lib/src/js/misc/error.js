import { select } from 'd3'

// call this to add a warning icon to a graph and log an error to the console
export function error ({ target, error }) {
  console.error(`ERROR : ${target} : ${error}`)

  select(target).select('.mg-chart-title')
    .append('tspan')
    .attr('class', 'fa fa-x fa-exclamation-circle mg-warning')
    .attr('dx', '0.3em')
    .text('\uf06a')
}

export function internalError ({ target, error }) {
  console.error(`INTERNAL ERROR : ${target} : ${error}`)
}
