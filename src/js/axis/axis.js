import constants from '../misc/constants'
import { scaleLinear, scaleLog } from 'd3-scale'
import { axisTop, axisLeft, axisRight, axisBottom } from 'd3-axis'

export default class Axis {
  type = constants.scaleType.linear
  orientation
  label = ''
  top = 0
  left = 0
  rangeLength = 0
  domain = [0, 1]
  scale = null
  orientation = 'bottom'
  axisObject = null

  constructor (args) {
    console.log('setting up axis: ', args)
    this.type = args.type ?? this.type
    this.label = args.label ?? this.label
    this.top = args.top ?? this.top
    this.left = args.left ?? this.left
    this.scale = args.scale ?? this.scale
    this.rangeLength = args.rangeLength ?? this.rangeLength
    this.domain = args.domain ?? this.domain
    this.orientation = args.orientation ?? this.orientation

    // set up scale if necessary
    if (!this.scale) this.setupScale()

    this.setupAxisObject()
  }

  setupScale () {
    // set type
    this.scale = this.type === constants.scaleType.linear
      ? scaleLinear()
      : scaleLog()

    // set range and domain
    this.scale
      .range([this.left, this.rangeLength])
      .domain(this.domain)
  }

  setupAxisObject () {
    switch (this.orientation) {
      case constants.axisOrientation.top:
        this.axisObject = axisTop(this.scale)
        break
      case constants.axisOrientation.left:
        this.axisObject = axisLeft(this.scale)
        break
      case constants.axisOrientation.right:
        this.axisObject = axisRight(this.scale)
        break
      default:
        this.axisObject = axisBottom(this.scale)
        break
    }
  }

  mountTo (svg) {
    svg.append('g')
      .attr('transform', `translate(${this.left},${this.top})`)
      .call(this.axisObject)
  }
}
