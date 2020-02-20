import AbstractChart from './abstractChart'
import Axis from '../axis/axis'

export default class LineChart extends AbstractChart {
  xAxis = null
  yAxis = null
  constructor (args) {
    super(args)
    console.log('instantiating new line chart: ', args)

    // TODO handle complex variants of passed data

    // set up axes
    this.xAxis = new Axis(args.xAxis ?? {})
    this.yAxis = new Axis(args.yAxis ?? {})
    this.xAxis.mountTo(this.svg)
    this.yAxis.mountTo(this.svg)
  }
}
