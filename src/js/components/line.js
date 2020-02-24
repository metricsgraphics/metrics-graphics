import { line, curveBasis } from 'd3-shape'

export default class Line {
  lineObject = null
  data = null

  constructor ({
    data,
    xAccessor,
    yAccessor,
    xScale,
    yScale,
    curve
  }) {
    // cry if no data was passed
    if (!data) throw new Error('line needs data')
    this.data = data

    // set up line object
    this.lineObject = line()
      .x(d => xScale.scaleObject(xAccessor(d)))
      .y(d => yScale.scaleObject(yAccessor(d)))
      .curve(curve ?? curveBasis)
  }

  mountTo (svg) {
    svg
      .append('path')
      .classed('mg-line', true)
      .datum(this.data)
      .attr('d', this.lineObject)
  }
}
