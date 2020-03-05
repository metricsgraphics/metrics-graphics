import { Delaunay as DelaunayObject } from 'd3-delaunay'
import { max } from 'd3-array'
import { mouse } from 'd3-selection'

export default class Delaunay {
  points = []
  delaunay = null
  xScale = null
  yScale = null
  onPoint = d => null

  constructor ({ points, xAccessor, yAccessor, xScale, yScale, onPoint }) {
    // if the points are one-dimensional, treat them like that
    this.points = points.length
      ? Array.isArray(points[0])
        ? points.map((pointArray, arrayIndex) => pointArray.map(point => ({
          ...point,
          arrayIndex
        }))).flat()
        : points
      : []
    this.xScale = xScale
    this.yScale = yScale
    this.points = points
    this.delaunay = DelaunayObject.from(
      points.map(point => ([xAccessor(point), yAccessor(point)]))
    )
    this.onPoint = onPoint ?? this.onPoint
  }

  moveHandler () {
    const xScale = this.xScale
    const yScale = this.yScale
    const delaunay = this.delaunay
    const points = this.points
    const onPoint = this.onPoint
    return function () {
      const rawCoords = mouse(this)
      const x = xScale.scaleObject.invert(rawCoords[0])
      const y = yScale.scaleObject.invert(rawCoords[1])

      // find nearest point
      const index = delaunay.find(x, y)
      onPoint(points[index])
    }
  }

  mountTo (svg) {
    svg
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('opacity', 0)
      .attr('width', max(this.xScale.range))
      .attr('height', max(this.yScale.range))
      .on('mousemove', this.moveHandler(this.xScale, this.yScale, this.delaunay))
  }
}
