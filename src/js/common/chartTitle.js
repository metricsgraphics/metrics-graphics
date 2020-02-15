import { error } from '../misc/error'
import { getSvgChildOf } from '../misc/utility'

export function chartTitle (args) {
  'use strict'

  var svg = getSvgChildOf(args.target)

  // remove the current title if it exists
  svg.select('.mg-header').remove()

  if (args.target && args.title) {
    var chartTitle = svg.insert('text')
      .attr('class', 'mg-header')
      .attr('x', args.center_title_fullWidth ? args.width / 2 : (args.width + args.left - args.right) / 2)
      .attr('y', args.title_yPosition)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.55em')

    // show the title
    chartTitle.append('tspan')
      .attr('class', 'mg-chart-title')
      .text(args.title)
  }

  if (args.error) error(args)
}
