import AbstractChart from './abstractChart'
import Axis from '../axis/axis'

export default class LineChart extends AbstractChart {
  xAxis = null
  constructor (args) {
    super(args)
    console.log('instantiating new line chart: ', args)

    // TODO handle complex variants of passed data

    // set up axes
    this.xAxis = new Axis(args.xAxis ?? {})
    this.xAxis.mountTo(this.svg)
  }
}
