import { Selection } from 'd3'

export interface AccessorFunction<X = any, Y = any> {
  (dataObject: X): Y
}

export interface TextFunction {
  (dataObject: unknown): string
}

export interface InteractionFunction<T = any> {
  (pointArray: Array<T>): void
}

export interface EmptyInteractionFunction {
  (): void
}

export interface DefinedFunction {
  (dataObject: unknown): boolean
}

export interface Margin {
  left: number
  right: number
  bottom: number
  top: number
}

export interface DomainObject {
  x: Domain
  y: Domain
}

export enum LegendSymbol {
  LINE = 'line',
  CIRCLE = 'circle',
  SQUARE = 'square'
}

export enum BrushType {
  XY = 'xy',
  X = 'x',
  Y = 'y'
}

export type Domain = number[]
export type Range = number[]

export type GenericD3Selection = Selection<any, any, any, any>
export type SvgD3Selection = Selection<SVGElement, any, Element, any>
export type GD3Selection = Selection<SVGGElement, any, Element, any>
export type LineD3Selection = Selection<SVGLineElement, any, Element, any>
export type TextD3Selection = Selection<SVGTextElement, any, Element, any>
