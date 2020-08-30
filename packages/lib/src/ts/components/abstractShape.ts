import Scale from './scale'
import { SvgD3Selection } from '../misc/typings'

export interface IAbstractShape {
  /** datapoint used to generate shape */
  data?: any

  /** scale used to compute x values */
  xScale: Scale

  /** scale used to compute y values */
  yScale: Scale

  /** color used for fill and strokes */
  color?: string

  /** opacity of the shape fill */
  fillOpacity?: number

  /** width of the stroke around the shape */
  strokeWidth?: number
}

export default abstract class AbstractShape {
  data: any
  shapeObject: any
  xScale: Scale
  yScale: Scale
  color: string
  fillOpacity = 1
  strokeWidth = 0

  constructor({
    data,
    xScale,
    yScale,
    color,
    fillOpacity,
    strokeWidth
  }: IAbstractShape) {
    this.data = data
    this.xScale = xScale
    this.yScale = yScale
    this.color = color ?? 'black'
    this.fillOpacity = fillOpacity ?? this.fillOpacity
    this.strokeWidth = strokeWidth ?? this.strokeWidth
  }

  /**
   * Render the shape and mount it to the given node.
   * Implemented by classes extending AbstractShape.
   *
   * @param svg D3 node to mount the shape to
   */
  abstract mountTo(svg: SvgD3Selection): void

  /**
   * Hide the shape by setting the opacity to 0. This doesn't remove the shape.
   */
  hide(): void {
    if (this.shapeObject) this.shapeObject.attr('opacity', 0)
  }

  /**
   * Update the given parameters of the object.
   * Implemented by classes extending AbstractShape.
   *
   * @param args parameters to be updated
   */
  abstract update(args: any): void

  /**
   * Update generic properties of the shape.
   * This method can be used in the implementations of {@link AbstractShape#update}.
   *
   * @param color new color of the shape.
   * @param fillOpacity new fill opacity of the shape.
   * @param strokeWidth new stroke width of the shape.
   */
  updateGeneric({
    color,
    fillOpacity,
    strokeWidth
  }: Pick<IAbstractShape, 'color' | 'fillOpacity' | 'strokeWidth'>): void {
    if (color) this.updateColor(color)
    if (fillOpacity) this.updateOpacity(fillOpacity)
    if (strokeWidth) this.updateStroke(strokeWidth)
  }

  /**
   * Update the color of the shape.
   *
   * @param color new color of the shape.
   */
  updateColor(color: string): void {
    this.color = color
    this.updateProp('fill', color)
  }

  /**
   * Update the fill opacity of the shape.
   *
   * @param fillOpacity new fill opacity of the shape.
   */
  updateOpacity(fillOpacity: number): void {
    this.fillOpacity = fillOpacity
    this.updateProp('fill-opacity', fillOpacity)
  }

  /**
   * Update the stroke width of the shape.
   *
   * @param strokeWidth new stroke width of the shape.
   */
  updateStroke(strokeWidth: number): void {
    this.strokeWidth = strokeWidth
    this.updateProp('stroke-width', strokeWidth)
  }

  /**
   * Update an attribute of the raw shape node.
   *
   * @param name attribute name
   * @param value new value
   */
  updateProp(name: string, value: number | string): void {
    if (this.shapeObject) this.shapeObject.attr(name, value)
  }

  /**
   * Remove the shape.
   */
  dismount(): void {
    if (this.shapeObject) this.shapeObject.remove()
  }
}
