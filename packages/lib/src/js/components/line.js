import { line, curveCatmullRom } from 'd3-shape'
import { schemeCategory10 } from 'd3-scale-chromatic'

export default class Line {
  lineObject = null
  data = null
  index = 0

  constructor ({
    data,
    xAccessor,
    yAccessor,
    xScale,
    yScale,
    curve,
    index
  }) {
    // cry if no data was passed
    if (!data) throw new Error('line needs data')
    this.data = data
    this.index = index ?? this.index

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
      .attr('stroke', schemeCategory10[this.index])
      .datum(this.data)
      .attr('d', this.lineObject)
  }
}
