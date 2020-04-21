import { Component } from 'preact'

import ufoDates from '../assets/data/ufoDates'
import HistogramChart from 'mg2/src/js/charts/histogram'
import ExampleContainer from '../components/exampleContainer'

const codeChart1 = `new HistogramChart({
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
})`

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
        <ExampleContainer
          title="Difference in UFO Sighting and Reporting Dates (in months)"
          description="Semi-real data about the reported differences between the supposed sighting of a UFO and the date it was reported."
          id="histogramChart1"
          code={codeChart1}
        />
      </div>
    )
  }
}
