import Delaunay from '../components/delaunay'
import Rug, { RugOrientation } from '../components/rug'
import { makeAccessorFunction } from '../misc/utility'
import { AccessorFunction, LegendSymbol, InteractionFunction, EmptyInteractionFunction } from '../misc/typings'
import Point from '../components/point'
import { TooltipSymbol } from '../components/tooltip'
import AbstractChart, { IAbstractChart } from './abstractChart'

export interface IScatterChart extends IAbstractChart {
  /** accessor specifying the size of a data point. Can be either a string (name of the size field) or a function (receiving a data point and returning its size) */
  sizeAccessor?: string | AccessorFunction

  /** whether or not to generate a rug for the x axis */
  xRug?: boolean

  /** whether or not to generate a rug for the x axis */
  yRug?: boolean
}

interface ActivePoint {
  i: number
  j: number
}

export default class ScatterChart extends AbstractChart {
  points?: Array<any>
  delaunay?: Delaunay
  delaunayPoint?: Point
  sizeAccessor: AccessorFunction
  showXRug: boolean
  xRug?: Rug
  showYRug: boolean
  yRug?: Rug
  _activePoint: ActivePoint = { i: -1, j: -1 }

  constructor({ sizeAccessor = () => 3, xRug = false, yRug = false, ...args }: IScatterChart) {
    super(args)
    this.showXRug = xRug
    this.showYRug = yRug

    this.sizeAccessor = sizeAccessor ? makeAccessorFunction(sizeAccessor) : () => 3

    this.redraw()
  }

  redraw(): void {
    // set up rugs if necessary
    this.mountRugs()

    // set tooltip type
    if (this.tooltip) {
      this.tooltip.update({ legendObject: TooltipSymbol.CIRCLE })
      this.tooltip.hide()
    }

    // set up points
    this.mountPoints()

    // generate delaunator
    this.mountDelaunay()

    // mount legend if any
    this.mountLegend(LegendSymbol.CIRCLE)

    // mount brush if necessary
    this.mountBrush(this.brush)
  }

  /**
   * Mount new rugs.
   */
  mountRugs(): void {
    // if content is not set yet, abort
    if (!this.content) {
      console.error('error: content not set yet')
      return
    }

    if (this.showXRug) {
      this.xRug = new Rug({
        accessor: this.xAccessor,
        scale: this.xScale,
        colors: this.colors,
        data: this.data,
        left: this.plotLeft,
        top: this.innerHeight + this.plotTop + this.buffer,
        orientation: RugOrientation.HORIZONTAL // TODO how to pass tickLength etc?
      })
      this.xRug.mountTo(this.content)
    }
    if (this.showYRug) {
      this.yRug = new Rug({
        accessor: this.yAccessor,
        scale: this.yScale,
        colors: this.colors,
        data: this.data,
        left: this.left,
        top: this.plotTop,
        orientation: RugOrientation.VERTICAL
      })
      this.yRug.mountTo(this.content)
    }
  }

  /**
   * Mount scatter points.
   */
  mountPoints(): void {
    // if container is not set yet, abort
    if (!this.container) {
      console.error('error: container not set yet')
      return
    }

    this.points = this.data.map((pointSet, i) =>
      pointSet.map((data: any) => {
        const point = this.generatePoint({
          data,
          color: this.colors[i],
          radius: this.sizeAccessor(data) as number,
          fillOpacity: 0.3,
          strokeWidth: 1
        })
        point.mountTo(this.container!)
        return point
      })
    )
  }

  /**
   * Handle incoming points from the delaunay triangulation.
   *
   * @returns handler function
   */
  onPointHandler(): InteractionFunction {
    return ([point]) => {
      this.activePoint = { i: point.arrayIndex ?? 0, j: point.index }

      // set tooltip if necessary
      if (!this.tooltip) return
      this.tooltip.update({ data: [point] })
    }
  }

  /**
   * Handle leaving the delaunay area.
   *
   * @returns handler function
   */
  onLeaveHandler(): EmptyInteractionFunction {
    return () => {
      this.activePoint = { i: -1, j: -1 }
      if (this.tooltip) this.tooltip.hide()
    }
  }

  /**
   * Mount new delaunay triangulation instance.
   */
  mountDelaunay(): void {
    // if container is not set yet, abort
    if (!this.container) {
      console.error('error: container not set yet')
      return
    }

    this.delaunayPoint = this.generatePoint({ radius: 3 })
    this.delaunay = new Delaunay({
      points: this.data,
      xAccessor: this.xAccessor,
      yAccessor: this.yAccessor,
      xScale: this.xScale,
      yScale: this.yScale,
      nested: true,
      onPoint: this.onPointHandler(),
      onLeave: this.onLeaveHandler()
    })
    this.delaunay.mountTo(this.container)
  }

  get activePoint() {
    return this._activePoint
  }

  set activePoint({ i, j }: ActivePoint) {
    // abort if points are not set yet
    if (!this.points) {
      console.error('error: cannot set point, as points are not set')
      return
    }

    // if a point was previously set, de-set it
    if (this._activePoint.i !== -1 && this._activePoint.j !== -1) {
      this.points[this._activePoint.i][this._activePoint.j].update({
        fillOpacity: 0.3
      })
    }

    // set state
    this._activePoint = { i, j }

    // set point to active
    if (i !== -1 && j !== -1) this.points[i][j].update({ fillOpacity: 1 })
  }
}
