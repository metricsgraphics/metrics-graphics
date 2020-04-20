import AbstractChart from './abstractChart'
import { extent } from 'd3-array'
import Point from '../components/point'
import Delaunay from '../components/delaunay'
import constants from '../misc/constants'
import Legend from '../components/legend'
import Rug from '../components/rug'

export default class ScatterChart extends AbstractChart {
  points = []
  delaunay = null
  delaunayPoint = null
  sizeAccessor = null
  xRug = null
  yRug = null
  _activePoint = { i: -1, j: -1 }

  constructor ({ sizeAccessor, xRug, yRug, ...args }) {
    super(args)

    // set up rugs if necessary
    if (xRug) {
      this.xRug = new Rug({
        accessor: this.xAccessor,
        scale: this.xScale,
        colors: this.colors,
        data: this.data,
        left: this.plotLeft,
        top: this.innerHeight + this.plotTop + this.buffer,
        orientation: constants.orientation.horizontal // TODO how to pass tickLength etc?
      })
      this.xRug.mountTo(this.svg)
    }
    if (yRug) {
      this.yRug = new Rug({
        accessor: this.yAccessor,
        scale: this.yScale,
        colors: this.colors,
        data: this.data,
        left: this.left,
        top: this.plotTop,
        orientation: constants.orientation.vertical
      })
      this.yRug.mountTo(this.svg)
    }

    // set tooltip type
    if (this.tooltip) {
      this.tooltip.update({ legendObject: constants.symbol.dot })
      this.tooltip.hide()
    }

    this.sizeAccessor = sizeAccessor
      ? typeof sizeAccessor === 'function'
        ? sizeAccessor
        : d => d[sizeAccessor]
      : d => 3

    // set up points
    this.points = this.data.map((pointSet, i) => pointSet.map(data => {
      const point = new Point({
        data,
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
      onPoint: (points) => {
        const point = points[0]
        this.activePoint = { i: point.arrayIndex ?? 0, j: point.index }

        // set tooltip
        if (this.tooltip) {
          this.tooltip.update({
            legendObject: constants.legendObject.circle,
            data: points
          })
        }
      },
      onLeave: () => {
        this.activePoint = { i: -1, j: -1 }
        if (this.tooltip) this.tooltip.hide()
      }
    })
    this.delaunay.mountTo(this.container)

    // mount legend if any
    if (this.legend && this.legend.length > 0 && this.legendTarget) {
      const legend = new Legend({
        legend: this.legend,
        colorScheme: this.colors,
        symbolType: constants.legendObject.circle
      })
      legend.mountTo(this.legendTarget)
    }
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
