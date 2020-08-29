import { select } from 'd3-selection'
import { AccessorFunction } from './typings'

enum Dimension {
  HEIGHT = 'height',
  WIDTH = 'width'
}

/**
 * Handle cases where the user specifies an accessor string instead of an accessor function.
 *
 * @param functionOrString accessor string/function to be made an accessor function
 * @returns accessor function
 */
export function makeAccessorFunction(
  functionOrString: AccessorFunction | string
): AccessorFunction {
  return typeof functionOrString === 'string'
    ? (d: any) => d[functionOrString]
    : functionOrString
}

/**
 * Generate a random id.
 * Used to create ids for clip paths, which need to be referenced by id.
 *
 * @returns random id string.
 */
export function randomId(): string {
  return Math.random().toString(36).substring(2, 15)
}

/**
 * Get height or width in pixels.
 *
 * @param target d3 select specifier.
 * @param dimension height or width.
 * @returns width or height in pixels.
 */
export function getPixelDimension(
  target: string,
  dimension: Dimension
): number {
  return Number(select(target).style(dimension).replace(/px/g, ''))
}

/**
 * Get width of element.
 *
 * @param width custom width if applicable.
 * @param target d3 select specifier.
 * @returns width of element.
 */
export function getWidth(width: number, target: string): number {
  return getPixelDimension(target, Dimension.WIDTH)
}

/**
 * Get height of element.
 *
 * @param height custom height if applicable.
 * @param target d3 select specifier.
 * @returns height of element.
 */
export function getHeight(
  isFullHeight: boolean,
  height: number,
  target: string
): number {
  return getPixelDimension(target, Dimension.WIDTH)
}
