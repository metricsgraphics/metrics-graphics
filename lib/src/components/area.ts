import { area, curveCatmullRom, CurveFactory } from 'd3'
import { AccessorFunction, DefinedFunction, SvgD3Selection } from '../misc/typings'
import Scale from './scale'

interface IArea {
  /** data for which the area should be created */
  data: Array<any>

  /** x accessor function */
  xAccessor: AccessorFunction

  /** y accessor function */
  yAccessor: AccessorFunction

  /** y base accessor function (defaults to 0) */
  y0Accessor?: AccessorFunction

  /** alternative to yAccessor */
  y1Accessor?: AccessorFunction

  /** scale used to scale elements in x direction */
  xScale: Scale

  /** scale used to scale elements in y direction */
  yScale: Scale

  /** curving function. See {@link https://github.com/d3/d3-shape#curves} for available curves in d3 */
  curve?: CurveFactory

  /** color of the area */
  color?: string

  /** specifies whether or not to show a given datapoint */
  defined?: DefinedFunction
}

export default class Area {
  data: Array<any>
  areaObject?: any
  index = 0
  color = 'none'

  constructor({ data, xAccessor, yAccessor, y0Accessor, y1Accessor, xScale, yScale, curve, color, defined }: IArea) {
    this.data = data
    this.color = color ?? this.color

    const y0 = y0Accessor ?? ((d) => 0)
    const y1 = y1Accessor ?? yAccessor

    // set up line object
    this.areaObject = area()
      .defined((d) => {
        if (y0(d) === null || y1(d) === null) return false
        return !defined ? true : defined(d)
      })
      .x((d) => xScale.scaleObject(xAccessor(d)))
      .y1((d) => yScale.scaleObject(y1(d)))
      .y0((d) => yScale.scaleObject(y0(d)))
      .curve(curve ?? curveCatmullRom)
  }

  /**
   * Mount the area to a given d3 node.
   *
   * @param svg d3 node to mount the area to.
   */
  mountTo(svg: SvgD3Selection): void {
    svg.append('path').classed('mg-area', true).attr('fill', this.color).datum(this.data).attr('d', this.areaObject)
  }
}
