import { scaleLinear } from 'd3-scale'

export default class Scale {
  name = null
  type = null
  scaleObject = null
  minValue = null
  maxValue = null

  constructor ({ name, scaleObject, type, range, domain, minValue, maxValue }) {
    this.name = name ?? this.name
    this.scaleObject = scaleObject ?? this.getScaleObject(type)

    // set optional custom ranges and domains
    if (range) this.range = range
    if (domain) this.domain = domain

    // set optional min and max
    this.minValue = minValue ?? this.minValue
    this.maxValue = maxValue ?? this.maxValue
  }

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
