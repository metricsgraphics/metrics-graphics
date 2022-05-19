import { max, bin } from 'd3'
import Delaunay from '../components/delaunay'
import Rect from '../components/rect'
import { TooltipSymbol } from '../components/tooltip'
import { LegendSymbol, InteractionFunction } from '../misc/typings'
import AbstractChart, { IAbstractChart } from './abstractChart'

export interface IHistogramChart extends IAbstractChart {
  binCount?: number
}

/**
 * Creates a new histogram graph.
 *
 * @param {Object} args argument object. See {@link AbstractChart} for general parameters.
 * @param {Number} [args.binCount] approximate number of bins that should be used for the histogram. Defaults to what d3.bin thinks is best.
 */
export default class HistogramChart extends AbstractChart {
  bins: Array<any>
  rects?: Array<Rect>
  delaunay?: any
  delaunayBar?: any
  _activeBar = -1

  constructor({ binCount, ...args }: IHistogramChart) {
    super({
      ...args,
      computeDomains: () => {
        // set up histogram
        const dataBin = bin()
        if (binCount) dataBin.thresholds(binCount)
        const bins = dataBin(args.data)

        // update domains
        return {
          x: [0, bins.length],
          y: [0, max(bins, (bin: Array<any>) => +bin.length)!]
        }
      }
    })

    // set up histogram
    const dataBin = bin()
    if (binCount) dataBin.thresholds(binCount)
    this.bins = dataBin(this.data)

    this.redraw()
  }

  redraw(): void {
    // set up histogram rects
    this.mountRects()

    // set tooltip type
    if (this.tooltip) {
      this.tooltip.update({ legendObject: TooltipSymbol.SQUARE })
      this.tooltip.hide()
    }

    // generate delaunator
    this.mountDelaunay()

    // mount legend if any
    this.mountLegend(LegendSymbol.SQUARE)

    // mount brush if necessary
    this.mountBrush(this.brush)
  }

  /**
   * Mount the histogram rectangles.
   */
  mountRects(): void {
    this.rects = this.bins.map((bin) => {
      const rect = new Rect({
        data: bin,
        xScale: this.xScale,
        yScale: this.yScale,
        color: this.colors[0],
        fillOpacity: 0.5,
        strokeWidth: 0,
        xAccessor: (bin) => bin.x0,
        yAccessor: (bin) => bin.length,
        widthAccessor: (bin) => this.xScale.scaleObject(bin.x1)! - this.xScale.scaleObject(bin.x0)!,
        heightAccessor: (bin) => -bin.length
      })
      rect.mountTo(this.container!)
      return rect
    })
  }

  /**
   * Handle move events from the delaunay triangulation.
   *
   * @returns handler function.
   */
  onPointHandler(): InteractionFunction {
    return ([point]) => {
      this.activeBar = point.index

      // set tooltip if necessary
      if (!this.tooltip) return
      this.tooltip.update({ data: [point] })
    }
  }

  /**
   * Handle leaving the delaunay triangulation area.
   *
   * @returns handler function.
   */
  onLeaveHandler() {
    return () => {
      this.activeBar = -1
      if (this.tooltip) this.tooltip.hide()
    }
  }

  /**
   * Mount new delaunay triangulation.
   */
  mountDelaunay(): void {
    this.delaunayBar = new Rect({
      xScale: this.xScale,
      yScale: this.yScale,
      xAccessor: (bin) => bin.x0,
      yAccessor: (bin) => bin.length,
      widthAccessor: (bin) => bin.x1 - bin.x0,
      heightAccessor: (bin) => -bin.length
    })
    this.delaunay = new Delaunay({
      points: this.bins.map((bin) => ({
        x: (bin.x1 + bin.x0) / 2,
        y: 0,
        time: bin.x0,
        count: bin.length
      })),
      xAccessor: (d) => d.x,
      yAccessor: (d) => d.y,
      xScale: this.xScale,
      yScale: this.yScale,
      onPoint: this.onPointHandler(),
      onLeave: this.onLeaveHandler()
    })
    this.delaunay.mountTo(this.container)
  }

  get activeBar() {
    return this._activeBar
  }

  set activeBar(i: number) {
    // if rexts are not set yet, abort
    if (!this.rects) {
      console.error('error: can not set active bar, rects are empty')
      return
    }

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
