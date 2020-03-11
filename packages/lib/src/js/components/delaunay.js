import { Delaunay as DelaunayObject } from 'd3-delaunay'
import { max } from 'd3-array'
import { mouse } from 'd3-selection'

export default class Delaunay {
  points = []
  delaunay = null
  xScale = null
  yScale = null
  onPoint = d => null
  onLeave = () => null
  onClick = () => null
  rect = null

  constructor ({ points, xAccessor, yAccessor, xScale, yScale, onPoint, onLeave, onClick, nested }) {
    // Case 1: There is only one dimension of points (e.g. one line).
    // In this case, only use the x-distance by setting all y values to zero.
    // if the points are one-dimensional, treat them like that.
    const isNested = nested ?? (Array.isArray(points[0]) && points.length > 1)
    this.points = points.length
      ? isNested
        ? points.map((pointArray, arrayIndex) => pointArray.map(point => ({
          ...point,
          arrayIndex
        }))).flat(Infinity)
        : points.flat(Infinity)
      : []
    this.xScale = xScale
    this.yScale = yScale
    this.delaunay = DelaunayObject.from(
      this.points.map(point => ([xAccessor(point), isNested ? yAccessor(point) : 0]))
    )
    this.onPoint = onPoint ?? this.onPoint
    this.onLeave = onLeave ?? this.onLeave
    this.onClick = onClick ?? this.onClick
  }

  gotPoint (rawX, rawY) {
    const x = this.xScale.scaleObject.invert(rawX)
    const y = this.yScale.scaleObject.invert(rawY)

    // find nearest point
    const index = this.delaunay.find(x, y)
    this.onPoint({ ...this.points[index], index })
  }

  clickedPoint (rawX, rawY) {
    const x = this.xScale.scaleObject.invert(rawX)
    const y = this.yScale.scaleObject.invert(rawY)

    // find nearest point
    const index = this.delaunay.find(x, y)
    this.onClick({ ...this.points[index], index })
  }

  mountTo (svg) {
    this.rect = svg
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('opacity', 0)
      .attr('pointer-events', 'all')
      .attr('width', max(this.xScale.range))
      .attr('height', max(this.yScale.range))
    this.rect.on('mousemove', () => {
      const rawCoords = mouse(svg.node())
      this.gotPoint(rawCoords[0], rawCoords[1])
    })
    this.rect.on('mouseleave', () => {
      this.onLeave()
    })
    this.rect.on('click', () => {
      const rawCoords = mouse(svg.node())
      this.clickedPoint(rawCoords[0], rawCoords[1])
    })
  }
}
