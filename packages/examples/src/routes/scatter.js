import { Component } from 'preact'
import ScatterChart from 'mg2/src/js/charts/scatter'

import points1 from '../assets/data/points1'

export default class Lines extends Component {
  scatterChart1 = null

  componentDidMount () {
    this.scatterChart1 = new ScatterChart({
      data: points1,
      width: 300,
      height: 200,
      target: '#scatterChart1',
      xAccessor: 'x',
      yAccessor: 'y'
    })
  }

  render () {
    return (
      <div>
        <div className="example-container">
          <div>
            <p>Simple Scatterplot</p>
            <small>
            This is an example scatterplot, in which we have enabled rug plots on the y-axis by setting the rug option to true.
            </small>
            <div id="scatterChart1" />
          </div>
          <div>
            <code><pre /></code>
          </div>
        </div>
      </div>
    )
  }
}
