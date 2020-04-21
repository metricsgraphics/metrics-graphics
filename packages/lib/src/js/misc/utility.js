import { select } from 'd3-selection'

/**
 * Handle cases where the user specifies an accessor string instead of an accessor function.
 *
 * @param {Function | String} functionOrString accessor string/function to be made an accessor function
 * @returns {Function} accessor function
 */
export function makeAccessorFunction (functionOrString) {
  return typeof functionOrString === 'string'
    ? d => d[functionOrString]
    : functionOrString
}

/**
 * Check if an array is an array of arrays.
 *
 * @param {Array} arr array to be checked.
 * @returns {Boolean} whether or not the given array is an array of arrays.
 */
export function isArrayOfArrays (arr) { return arr.every(el => Array.isArray(el)) }

/**
 * Check if an array is an array of objects.
 *
 * @param {Array} arr array to be checked.
 * @returns {Boolean} whether or not the given array is an array of arrays.
 */
export function isArrayOfObjects (arr) { return arr.every(el => typeof el === 'object' && el !== null) }

/**
 * Check if an array is an array of objects or empty.
 *
 * @param {Array} arr array to be checked.
 * @returns {Boolean} whether or not the array is an array of objects or empty.
 */
export function isArrayOfObjectsOrEmpty (arr) { return arr.every(el => typeof el === 'object') }

/**
 * Generate a random id.
 * Used to create ids for clip paths, which need to be referenced by id.
 *
 * @returns {String} random id string.
 */
export function randomId () { return Math.random().toString(36).substring(2, 15) }

/**
 * Get height or width in pixels.
 *
 * @param {String} target d3 select specifier.
 * @param {String} dimension height or width.
 * @returns {Number} width or height in pixels.
 */
export function getPixelDimension (target, dimension) { return Number(select(target).style(dimension).replace(/px/g, '')) }

/**
 * Get width of element.
 *
 * @param {String} target d3 select specifier.
 * @returns {Number} width of element.
 */
export function getWidth (target) { return getPixelDimension(target, 'width') }

/**
 * Get height of element.
 *
 * @param {String} target d3 select specifier.
 * @returns {Number} height of element.
 */
export function getHeight (target) { return getPixelDimension(target, 'height') }
