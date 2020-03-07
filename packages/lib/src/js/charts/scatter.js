import AbstractChart from './abstractChart'
import { extent } from 'd3-array'
import Point from '../components/point'
import Delaunay from '../components/delaunay'

export default class ScatterChart extends AbstractChart {
  points = []
  delaunay = null
  delaunayPoint = null
  sizeAccessor = null
  _activePoint = { i: -1, j: -1 }

  constructor ({ sizeAccessor, ...args }) {
    console.log('init new scatter chart: ', args)
    super(args)

    this.sizeAccessor = sizeAccessor
      ? typeof sizeAccessor === 'function'
        ? sizeAccessor
        : d => d[sizeAccessor]
      : d => 3

    // set up points
    this.points = this.data.map((pointSet, i) => pointSet.map(data => {
      const point = new Point({
        point: data,
        xAccessor: this.xAccessor,
        yAccessor: this.yAccessor,
        xScale: this.xScale,
        yScale: this.yScale,
        color: this.colors[i],
        radius: this.sizeAccessor(data),
        fillOpacity: 0.3,
        strokeWidth: 1
      })
      point.mountTo(this.container)
      return point
    }))

    // generate delaunator
    this.delaunayPoint = new Point({
      xAccessor: this.xAccessor,
      yAccessor: this.yAccessor,
      xScale: this.xScale,
      yScale: this.yScale,
      radius: 3
    })
    this.delaunay = new Delaunay({
      points: this.data,
      xAccessor: this.xAccessor,
      yAccessor: this.yAccessor,
      xScale: this.xScale,
      yScale: this.yScale,
      nested: true,
      onPoint: (point) => {
        this.activePoint = { i: point.arrayIndex ?? 0, j: point.index }

        // set tooltip
        if (this.tooltip) {
          this.tooltip.update({
            color: point.arrayIndex ? this.colors[point.arrayIndex] : this.colors[0],
            data: point,
            legendCategory: this.legend && typeof point.arrayIndex !== 'undefined'
              ? this.legend[point.arrayIndex]
              : undefined
          })
        }
      },
      onLeave: () => {
        this.activePoint = { i: -1, j: -1 }
        if (this.tooltip) this.tooltip.hide()
      }
    })
    this.delaunay.mountTo(this.container)
  }

  set activePoint ({ i, j }) {
    // if a point was previously set, de-set it
    if (this._activePoint.i !== -1 && this._activePoint.j !== -1) {
      this.points[this._activePoint.i][this._activePoint.j].update({ fillOpacity: 0.3 })
    }

    // set state
    this._activePoint = { i, j }

    // set point to active
    if (i !== -1 && j !== -1) this.points[i][j].update({ fillOpacity: 1 })
  }

  normalizeData () {
    if (this.isArrayOfObjects) this.data = [this.data]
  }

  computeDomains () {
    const flatData = this.data.flat()
    const xExtent = extent(flatData, this.xAccessor)
    const yExtent = extent(flatData, this.yAccessor)
    this.xScale.domain = xExtent
    this.yScale.domain = yExtent
  }
}
