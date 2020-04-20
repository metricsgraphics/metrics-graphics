import { scaleLinear } from 'd3-scale'

export default class Scale {
  type = null
  scaleObject = null
  minValue = null
  maxValue = null

  /**
   * Set up a new scale.
   *
   * @param {String} [type='linear'] type of scale. Can currently only be linear.
   * @param {Array} [range] range of the scale.
   * @param {Array} [domain] domain of the scale.
   * @param {Number} [minValue] overwrites the lower bound of the domain.
   * @param {Number} [maxValue] overwrites the upper bound of the domain.
   */
  constructor ({ scaleObject, type, range, domain, minValue, maxValue }) {
    this.scaleObject = scaleObject ?? this.getScaleObject(type)

    // set optional custom ranges and domains
    if (range) this.range = range
    if (domain) this.domain = domain

    // set optional min and max
    this.minValue = minValue ?? this.minValue
    this.maxValue = maxValue ?? this.maxValue
  }

  /**
   * Get the d3 scale object for a given scale type.
   *
   * @param {String} type scale type
   * @returns {Object} d3 scale type
   */
  getScaleObject (type) {
    switch (type) {
      default: return scaleLinear()
    }
  }

  get range () { return this.scaleObject.range() }
  get domain () { return this.scaleObject.domain() }

  set range (range) { this.scaleObject.range(range) }
  set domain (domain) {
    // fix custom domain values if necessary
    if (this.minValue !== null) domain[0] = this.minValue
    if (this.maxValue !== null) domain[1] = this.maxValue
    this.scaleObject.domain(domain)
  }
}
