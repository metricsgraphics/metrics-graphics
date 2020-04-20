import AbstractChart from './abstractChart'
import { bin, max } from 'd3-array'
import Delaunay from '../components/delaunay'
import constants from '../misc/constants'
import Legend from '../components/legend'
import Rect from '../components/rect'

export default class HistogramChart extends AbstractChart {
  bins = []
  rects = []
  delaunay = null
  delaunayBar = null
  _activeBar = -1

  /**
   * Creates a new histogram graph.
   * @param {Number} [binCount] approximate number of bins that should be used for the histogram. Defaults to what d3.bin thinks is best.
   */
  constructor ({ binCount, ...args }) {
    super({ binCount, ...args })

    // set up histogram
    const dataBin = bin()
    if (binCount) dataBin.thresholds(binCount)
    this.bins = dataBin(this.data)

    // set up histogram rects
    this.rects = this.bins.map(bin => {
      const rect = new Rect({
        data: bin,
        xScale: this.xScale,
        yScale: this.yScale,
        color: this.colors[0],
        fillOpacity: 0.5,
        strokeWidth: 0,
        xAccessor: bin => bin.x0,
        yAccessor: bin => bin.length,
        widthAccessor: bin => bin.x1 - bin.x0,
        heightAccessor: bin => -bin.length
      })
      rect.mountTo(this.container)
      return rect
    })

    // set tooltip type
    if (this.tooltip) {
      this.tooltip.update({ legendObject: 'square' })
      this.tooltip.hide()
    }

    // generate delaunator
    this.delaunayBar = new Rect({
      xScale: this.xScale,
      yScale: this.yScale,
      xAccessor: bin => bin.x0,
      yAccessor: bin => bin.length,
      widthAccessor: bin => bin.x1 - bin.x0,
      heightAccessor: bin => -bin.length
    })
    this.delaunay = new Delaunay({
      points: this.bins.map(bin => ({
        x: (bin.x1 + bin.x0) / 2,
        y: 0,
        time: bin.x0,
        count: bin.length
      })),
      xAccessor: d => d.x,
      yAccessor: d => d.y,
      xScale: this.xScale,
      yScale: this.yScale,
      onPoint: (points) => {
        const point = points[0]
        this.activeBar = point.index

        // set tooltip
        if (this.tooltip) {
          this.tooltip.update({
            data: points
          })
        }
      },
      onLeave: () => {
        this.activeBar = -1
        if (this.tooltip) this.tooltip.hide()
      }
    })
    this.delaunay.mountTo(this.container)

    // mount legend if any
    if (this.legend && this.legend.length > 0 && this.legendTarget) {
      const legend = new Legend({
        legend: this.legend,
        colorScheme: this.colors,
        symbolType: constants.legendObject.square
      })
      legend.mountTo(this.legendTarget)
    }
  }

  computeDomains ({ binCount }) {
    // set up histogram
    const dataBin = bin()
    if (binCount) dataBin.thresholds(binCount)
    const bins = dataBin(this.data)

    // update domains
    this.xScale.domain = [0, bins.length]
    this.yScale.domain = [0, max(bins, bin => bin.length)]
  }

  set activeBar (i) {
    // if a bar was previously set, de-set it
    if (this._activeBar !== -1) {
      this.rects[this._activeBar].update({ fillOpacity: 0.5 })
    }

    // set state
    this._activeBar = i

    // set point to active
    if (i !== -1) this.rects[i].update({ fillOpacity: 1 })
  }
}
