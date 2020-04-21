import { Component } from 'preact'

import ufoDates from '../assets/data/ufoDates'
import HistogramChart from 'mg2/src/js/charts/histogram'

export default class Lines extends Component {
  histogramChart1 = null

  componentDidMount () {
    this.histogramChart1 = new HistogramChart({
      data: ufoDates.map(date => (parseInt(date, 10) / 30)).sort(),
      width: 600,
      height: 200,
      right: 40,
      binCount: 150,
      target: '#histogramChart1',
      yAxis: {
        extendedTicks: true
      },
      tooltipFunction: bar => `${bar.time} months, volume ${bar.count}`
    })
  }

  render () {
    return (
      <div className="container mx-auto mt-8">
        <div className="example-container">
          <div>
            <p>Difference in UFO Sighting and Reporting Dates (in months)</p>
            <small>
            Semi-real data about the reported differences between the supposed sighting of a UFO and the date it was reported.
            </small>
            <div id="histogramChart1" />
          </div>
          <div>
            <code><pre>{`new HistogramChart({
  data: ufoDates.map(date => (parseInt(date, 10) / 30)).sort(),
  width: 600,
  height: 200,
  right: 40,
  binCount: 150,
  target: '#histogramChart1',
  yAxis: {
    extendedTicks: true
  },
  tooltipFunction: bar => \`\${bar.time} months, volume \${bar.count}\`
})`}</pre></code>
          </div>
        </div>
      </div>
    )
  }
}
