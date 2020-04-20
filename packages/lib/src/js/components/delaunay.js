import { Delaunay as DelaunayObject } from 'd3-delaunay'
import { max } from 'd3-array'
import { mouse } from 'd3-selection'

export default class Delaunay {
  points = []
  aggregatedPoints = null
  delaunay = null
  xScale = null
  yScale = null
  xAccessor = null
  onPoint = d => null
  onLeave = () => null
  onClick = () => null
  rect = null
  aggregate = false

  /**
   * Instantiate a new delaunay computation instance.
   *
   * @param {Array} points raw data basis for delaunay computations. Can be nested.
   * @param {Function} xAccessor function to access the x value for a given data point.
   * @param {Function} yAccessor function to access the y value for a given data point.
   * @param {Scale} xScale scale used to scale elements in x direction.
   * @param {Scale} yScale scale used to scale elements in y direction.
   * @param {Function} [onPoint] function called with the array of nearest points on mouse movement. If aggregate is false, the array will contain at most one element.
   * @param {Function} [onLeave] function called when the delaunay area is left.
   * @param {Function} [onClick] function called with the array of nearest points on mouse click in the delaunay area. If aggregate is false, the array will contain at most one element.
   * @param {Boolean} [nested=false] whether or not the points array contains sub-arrays.
   * @param {Boolean} [aggregate=false] if multiple points have the same x value and should be shown together, aggregate can be set to true.
   */
  constructor ({ points = [], xAccessor, yAccessor, xScale, yScale, onPoint, onLeave, onClick, nested, aggregate }) {
    // Case 1: There is only one dimension of points (e.g. one line).
    // In this case, only use the x-distance by setting all y values to zero.
    // if the points are one-dimensional, treat them like that.
    const isNested = nested ?? (Array.isArray(points[0]) && points.length > 1)
    this.points = isNested
      ? points.map((pointArray, arrayIndex) => pointArray.map((point, index) => ({
        ...point,
        index,
        arrayIndex
      }))).flat(Infinity)
      : points.flat(Infinity).map((p, index) => ({ ...p, index }))

    // if points should be aggregated, hash-map them based on their x accessor value
    if (aggregate) {
      this.aggregatedPoints = this.points.reduce((acc, val) => {
        const key = JSON.stringify(xAccessor(val))
        if (!acc.has(key)) {
          acc.set(key, [val])
        } else {
          acc.set(key, [val, ...acc.get(key)])
        }
        return acc
      }, new Map())
    }

    this.xScale = xScale
    this.yScale = yScale
    this.delaunay = DelaunayObject.from(
      this.points.map(point => ([xAccessor(point), isNested && !aggregate ? yAccessor(point) : 0]))
    )
    this.onPoint = onPoint ?? this.onPoint
    this.onLeave = onLeave ?? this.onLeave
    this.onClick = onClick ?? this.onClick
    this.xAccessor = xAccessor
    this.aggregate = aggregate ?? this.aggregate
  }

  /**
   * Handle raw mouse movement inside the delaunay rect.
   * Finds the nearest data point(s) and calls onPoint.
   *
   * @param {Number} rawX raw x coordinate of the cursor.
   * @param {Number} rawY raw y coordinate of the cursor.
   * @returns {void}
   */
  gotPoint (rawX, rawY) {
    const x = this.xScale.scaleObject.invert(rawX)
    const y = this.yScale.scaleObject.invert(rawY)

    // find nearest point
    const index = this.delaunay.find(x, y)

    // if points should be aggregated, get all points with the same x value
    if (this.aggregate) {
      this.onPoint(this.aggregatedPoints.get(JSON.stringify(this.xAccessor(this.points[index]))))
    } else {
      this.onPoint([this.points[index]])
    }
  }

  /**
   * Handle raw mouse clicks inside the delaunay rect.
   * Finds the nearest data point(s) and calls onClick.
   *
   * @param {Number} rawX raw x coordinate of the cursor.
   * @param {Number} rawY raw y coordinate of the cursor.
   * @returns {void}
   */
  clickedPoint (rawX, rawY) {
    const x = this.xScale.scaleObject.invert(rawX)
    const y = this.yScale.scaleObject.invert(rawY)

    // find nearest point
    const index = this.delaunay.find(x, y)
    this.onClick({ ...this.points[index], index })
  }

  /**
   * Mount the delaunator to a given d3 node.
   *
   * @param {Object} svg d3 selection to mount the delaunay elements to.
   * @returns {void}
   */
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
