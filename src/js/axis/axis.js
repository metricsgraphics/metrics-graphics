import constants from '../misc/constants'
import { axisTop, axisLeft, axisRight, axisBottom } from 'd3-axis'

export default class Axis {
  type = constants.scaleType.linear
  orientation
  label = ''
  top = 0
  left = 0
  scale = null
  orientation = 'bottom'
  axisObject = null

  constructor ({
    type,
    orientation,
    label,
    top,
    left,
    scale
  }) {
    console.log('setting up axis: ', arguments)

    // cry if no scale is set
    if (!scale) throw new Error('an axis needs a scale')

    this.scale = scale
    this.type = type ?? this.type
    this.label = label ?? this.label
    this.top = top ?? this.top
    this.left = left ?? this.left
    this.orientation = orientation ?? this.orientation

    this.setupAxisObject()
  }

  setupAxisObject () {
    switch (this.orientation) {
      case constants.axisOrientation.top:
        this.axisObject = axisTop(this.scale.scaleObject)
        break
      case constants.axisOrientation.left:
        this.axisObject = axisLeft(this.scale.scaleObject)
        break
      case constants.axisOrientation.right:
        this.axisObject = axisRight(this.scale.scaleObject)
        break
      default:
        this.axisObject = axisBottom(this.scale.scaleObject)
        break
    }
  }

  mountTo (svg) {
    svg.append('g')
      .attr('transform', `translate(${this.left},${this.top})`)
      .call(this.axisObject)
  }
}
