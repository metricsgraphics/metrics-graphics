import { scaleLinear } from 'd3-scale'

export default class Scale {
  name = null
  type = null
  scaleObject = null

  constructor ({ name, scaleObject, type, range, domain }) {
    console.log('instantiating scale: ', arguments)
    this.name = name ?? this.name
    this.scaleObject = scaleObject ?? this.getScaleObject(type)

    // set optional custom ranges and domains
    if (range) this.range = range
    if (domain) this.domain = domain
  }

  getScaleObject (type) {
    switch (type) {
      default: return scaleLinear()
    }
  }

  get range () { return this.scaleObject.range() }
  get domain () { return this.scaleObject.domain() }

  set range (range) { this.scaleObject.range(range) }
  set domain (domain) { this.scaleObject.domain(domain) }
}
