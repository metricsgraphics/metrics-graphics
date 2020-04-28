import { Component } from 'preact'

import ufoDates from '../assets/data/ufoDates'
import { HistogramChart } from 'metrics-graphics'
import ExampleList from '../components/exampleList'

const charts = [{
  title: 'Difference in UFO Sighting and Reporting Dates (in months)',
  description: 'Semi-real data about the reported differences between the supposed sighting of a UFO and the date it was reported.',
  id: 'histogramChart1',
  code: `new HistogramChart({
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
  })`,
  object: {
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
  }
}]

export default class Histogram extends Component {
  componentDidMount () {
    this.chartInstances = charts.map(chart => new HistogramChart(chart.object))
  }

  render = () => (<ExampleList charts={charts} />)
}
