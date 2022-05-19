import { AccessorFunction, SvgD3Selection } from '../misc/typings'
import AbstractShape, { IAbstractShape } from './abstractShape'

export interface IPoint extends IAbstractShape {
  /** function to access the x value of the point */
  xAccessor: AccessorFunction

  /** function to access the y value of the point */
  yAccessor: AccessorFunction

  /** radius of the point */
  radius?: number
}

export default class Point extends AbstractShape {
  xAccessor: AccessorFunction
  yAccessor: AccessorFunction
  radius = 1

  constructor({ xAccessor, yAccessor, radius, ...args }: IPoint) {
    super(args)
    this.xAccessor = xAccessor
    this.yAccessor = yAccessor
    this.radius = radius ?? this.radius
  }

  get cx(): number {
    return this.xScale.scaleObject(this.xAccessor(this.data))
  }

  get cy(): number {
    return this.yScale.scaleObject(this.yAccessor(this.data))
  }

  /**
   * Mount the point to the given node.
   *
   * @param svg d3 node to mount the point to.
   */
  mountTo(svg: SvgD3Selection): void {
    this.shapeObject = svg
      .append('circle')
      .attr('cx', this.cx)
      .attr('pointer-events', 'none')
      .attr('cy', this.cy)
      .attr('r', this.radius)
      .attr('fill', this.color)
      .attr('stroke', this.color)
      .attr('fill-opacity', this.fillOpacity)
      .attr('stroke-width', this.strokeWidth)
  }

  /**
   * Update the point.
   *
   * @param data point object
   */
  update({ data, ...args }: IAbstractShape): void {
    this.updateGeneric(args)
    if (data) {
      this.data = data
      if (!this.shapeObject) return
      this.shapeObject.attr('cx', this.cx).attr('cy', this.cy).attr('opacity', 1)
    }
  }
}
