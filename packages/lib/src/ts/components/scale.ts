import { scaleLinear, ScaleLinear } from 'd3-scale'

export enum ScaleType {
  LINEAR = 'linear'
}

type SupportedScale = ScaleLinear<number, number>

export interface IScale {
  /** type of scale (currently only linear) */
  type?: ScaleType

  /** scale range */
  range?: Array<number>

  /** scale domain */
  domain?: Array<number>

  /** overwrites domain lower bound */
  minValue?: number

  /** overwrites domain upper bound */
  maxValue?: number
}

export default class Scale {
  type: ScaleType
  scaleObject: SupportedScale
  minValue?: number
  maxValue?: number

  constructor({ type, range, domain, minValue, maxValue }: IScale) {
    this.type = type ?? ScaleType.LINEAR
    this.scaleObject = this.getScaleObject(this.type)

    // set optional custom ranges and domains
    if (range) this.range = range
    if (domain) this.domain = domain

    // set optional min and max
    this.minValue = minValue
    this.maxValue = maxValue
  }

  /**
   * Get the d3 scale object for a given scale type.
   *
   * @param {String} type scale type
   * @returns {Object} d3 scale type
   */
  getScaleObject(type: ScaleType): SupportedScale {
    switch (type) {
      default:
        return scaleLinear()
    }
  }

  get range(): Array<number> {
    return this.scaleObject.range()
  }
  set range(range: Array<number>) {
    this.scaleObject.range(range)
  }

  get domain(): Array<number> {
    return this.scaleObject.domain()
  }
  set domain(domain: Array<number>) {
    // fix custom domain values if necessary
    if (typeof this.minValue !== 'undefined') domain[0] = this.minValue
    if (typeof this.maxValue !== 'undefined') domain[1] = this.maxValue
    this.scaleObject.domain(domain)
  }
}
