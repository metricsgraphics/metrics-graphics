import { line, curveCatmullRom } from 'd3-shape'

export default class Line {
  lineObject = null
  data = null
  color = null

  constructor ({
    data,
    xAccessor,
    yAccessor,
    xScale,
    yScale,
    curve,
    color,
    colors,
    index
  }) {
    // cry if no data was passed
    if (!data) throw new Error('line needs data')
    this.data = data
    this.index = index ?? this.index
    this.color = color || (colors && index ? colors[index] : 'none')

    // set up line object
    this.lineObject = line()
      .x(d => xScale.scaleObject(xAccessor(d)))
      .y(d => yScale.scaleObject(yAccessor(d)))
      .curve(curve ?? curveCatmullRom)
  }

  mountTo (svg) {
    svg
      .append('path')
      .classed('mg-line', true)
      .attr('stroke', this.color)
      .datum(this.data)
      .attr('d', this.lineObject)
  }
}
