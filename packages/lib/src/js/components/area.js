import { area, curveBasis } from 'd3-shape'
import { schemeCategory10 } from 'd3-scale-chromatic'

export default class Area {
  areaObject = null
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
    this.areaObject = area()
      .x(d => xScale.scaleObject(xAccessor(d)))
      .y1(d => yScale.scaleObject(yAccessor(d)))
      .y0(d => yScale.scaleObject(0))
      .curve(curve ?? curveBasis)
  }

  mountTo (svg) {
    svg
      .append('path')
      .classed('mg-area', true)
      .attr('fill', schemeCategory10[this.index])
      .datum(this.data)
      .attr('d', this.areaObject)
  }
}
