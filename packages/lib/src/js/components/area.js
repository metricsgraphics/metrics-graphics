import { area, curveBasis } from 'd3-shape'
import { schemeCategory10 } from 'd3-scale-chromatic'

export default class Area {
  areaObject = null
  data = null
  index = 0
  color = null

  constructor ({
    data,
    xAccessor,
    yAccessor,
    y0Accessor,
    y1Accessor,
    xScale,
    yScale,
    curve,
    index,
    color
  }) {
    // cry if no data was passed
    if (!data) throw new Error('line needs data')
    this.data = data
    this.index = index ?? this.index
    this.color = color ?? schemeCategory10[this.index]

    const y0 = y0Accessor ?? (d => 0)
    const y1 = y1Accessor ?? yAccessor

    // set up line object
    this.areaObject = area()
      .x(d => xScale.scaleObject(xAccessor(d)))
      .y1(d => yScale.scaleObject(y1(d)))
      .y0(d => yScale.scaleObject(y0(d)))
      .curve(curve ?? curveBasis)
  }

  mountTo (svg) {
    svg
      .append('path')
      .classed('mg-area', true)
      .attr('fill', this.color)
      .datum(this.data)
      .attr('d', this.areaObject)
  }
}
