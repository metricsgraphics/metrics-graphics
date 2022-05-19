import { AccessorFunction, GenericD3Selection } from '../misc/typings'
import AbstractShape, { IAbstractShape } from './abstractShape'

export interface IRect extends IAbstractShape {
  /** function to access the x value of the rectangle */
  xAccessor: AccessorFunction

  /** function to access the y value of the rectangle */
  yAccessor: AccessorFunction

  /** function to access the width of the rectangle */
  widthAccessor: AccessorFunction

  /** function to access the height of the rectangle */
  heightAccessor: AccessorFunction
}

export default class Rect extends AbstractShape {
  xAccessor: AccessorFunction
  yAccessor: AccessorFunction
  widthAccessor: AccessorFunction
  heightAccessor: AccessorFunction

  constructor({ xAccessor, yAccessor, widthAccessor, heightAccessor, ...args }: IRect) {
    super(args)
    this.xAccessor = xAccessor
    this.yAccessor = yAccessor
    this.widthAccessor = widthAccessor
    this.heightAccessor = heightAccessor
  }

  get x(): number {
    return this.xScale.scaleObject(this.xAccessor(this.data))!
  }

  get y(): number {
    return this.yScale.scaleObject(this.yAccessor(this.data))!
  }

  get width(): number {
    return Math.max(0, Math.abs(this.widthAccessor(this.data)))
  }

  get height(): number {
    return Math.max(0, this.yScale.scaleObject(this.heightAccessor(this.data))!)
  }

  /**
   * Mount the rectangle to the given node.
   *
   * @param svg d3 node to mount the rectangle to.
   */
  mountTo(svg: GenericD3Selection): void {
    this.shapeObject = svg
      .append('rect')
      .attr('x', this.x)
      .attr('y', this.y)
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('pointer-events', 'none')
      .attr('fill', this.color)
      .attr('stroke', this.color)
      .attr('fill-opacity', this.fillOpacity)
      .attr('stroke-width', this.strokeWidth)
  }

  /**
   * Update the rectangle.
   *
   * @param data updated data object.
   */
  update({ data, ...args }: Partial<IAbstractShape>): void {
    this.updateGeneric(args)
    if (data) {
      this.data = data
      if (!this.shapeObject) return
      this.shapeObject
        .attr('x', this.x)
        .attr('y', this.y)
        .attr('width', this.width)
        .attr('height', this.height)
        .attr('opacity', 1)
    }
  }
}
