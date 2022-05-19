import { AccessorFunction } from './typings'

/**
 * Handle cases where the user specifies an accessor string instead of an accessor function.
 *
 * @param functionOrString accessor string/function to be made an accessor function
 * @returns accessor function
 */
export function makeAccessorFunction(functionOrString: AccessorFunction | string): AccessorFunction {
  return typeof functionOrString === 'string' ? (d: any) => d[functionOrString] : functionOrString
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
