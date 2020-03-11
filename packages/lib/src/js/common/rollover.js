import { getPlotRight, getPlotLeft, getBottom } from '../misc/utility'
import { select } from 'd3'

export function clearMouseoverContainer (svg) {
  svg.selectAll('.mg-active-datapoint-container').selectAll('*').remove()
}

export function setupMouseoverContainer (svg, args) {
  svg.select('.mg-active-datapoint').remove()
  const textAnchor = args.mouseover_align === 'right'
    ? 'end'
    : (args.mouseover_align === 'left'
      ? 'start'
      : 'middle')

  const mouseoverX = (args.mouseover_align === 'right')
    ? getPlotRight(args)
    : (args.mouseover_align === 'left'
      ? getPlotLeft(args)
      : (args.width - args.left - args.right) / 2 + args.left)

  const activeDatapoint = svg.select('.mg-active-datapoint-container')
    .attr('transform', 'translate(0 -18)')
    .append('text')
    .attr('class', 'mg-active-datapoint')
    .attr('xml:space', 'preserve')
    .attr('text-anchor', textAnchor)

  // set the rollover text's position; if we have markers on two lines,
  // nudge up the rollover text a bit
  let activeDatapointYNudge = 0.75

  const yPosition = (args.xAxis_position === 'bottom')
    ? args.top * activeDatapointYNudge
    : getBottom(args) + args.buffer * 3

  if (args.markers) {
    let yPos
    svg.selectAll('.mg-marker-text')
      .each(function () {
        if (!yPos) {
          yPos = select(this).attr('y')
        } else if (yPos !== select(this).attr('y')) {
          activeDatapointYNudge = 0.56
        }
      })
  }

  activeDatapoint
    .attr('transform', 'translate(' + mouseoverX + ',' + (yPosition) + ')')
}

export function mouseoverTspan (svg, text) {
  const tspan = svg.append('tspan').text(text)

  return {
    bold: () => tspan.attr('font-weight', 'bold'),
    font_size: (pts) => tspan.attr('font-size', pts),
    x: (x) => tspan.attr('x', x),
    y: (y) => tspan.attr('y', y),
    elem: tspan
  }
}

export function resetTextContainer (svg) {
  const textContainer = svg.select('.mg-active-datapoint')
  textContainer
    .selectAll('*')
    .remove()
  return textContainer
}

export function mouseoverRow (rowNumber, container, rargs) {
  const lineHeight = 1.1
  const rrr = container.append('tspan')
    .attr('x', 0)
    .attr('y', (rowNumber * lineHeight) + 'em')

  return {
    rargs,
    text: (text) => {
      return mouseoverTspan(rrr, text)
    }
  }
}

export function mouseoverText (args, rargs) {
  setupMouseoverContainer(rargs.svg, args)

  const mouseOver = {
    rowNumber: 0,
    rargs,
    mouseover_row: (rargs) => {
      mouseOver.rowNumber += 1
      return mouseoverRow(mouseOver.rowNumber, mouseOver.text_container, rargs)
    },
    text_container: resetTextContainer(rargs.svg)
  }

  return mouseOver
}
