import { Component } from 'preact'
import { LineChart } from 'mg2'

import fakeUsers1 from '../assets/data/fakeUsers1'
import fakeUsers2 from '../assets/data/fakeUsers2'
import confidence from '../assets/data/confidenceBand'

import ExampleContainer from '../components/exampleContainer'

const codeChart1 = `new LineChart({
  data: data.map(entry => ({
    date: new Date(entry.date),
    value: entry.value
  })),
  width: 600,
  height: 200,
  yScale: {
    minValue: 0
  },
  target: '#fakeUsers1',
  area: true,
  xAccessor: 'date',
  yAccessor: 'value'
})`

const codeConfidence = `new LineChart({
  data: confidence.map(entry => ({
    ...entry,
    date: new Date(entry.date)
  })),
  xAxis: {
    extendedTicks: true
  },
  yAxis: {
    tickFormat: 'percentage'
  },
  width: 600,
  height: 200,
  target: '#confidenceBand',
  confidenceBand: ['l', 'u']
})`

const codeMultiline = `new LineChart({
  data: fakeUsers2.map(fakeArray => fakeArray.map(fakeEntry => ({
    ...fakeEntry,
    date: new Date(fakeEntry.date)
  }))),
  width: 600,
  height: 200,
  target: '#fakeUsers2',
  xAccessor: 'date',
  yAccessor: 'value',
  legend: ['Line 1', 'Line 2', 'Line 3'],
  legendTarget: '#fakeUsers2Legend'
})`

const codeAggregate = `new LineChart({
  data: fakeUsers2.map(fakeArray => fakeArray.map(fakeEntry => ({
    ...fakeEntry,
    date: new Date(fakeEntry.date)
  }))),
  width: 600,
  height: 200,
  target: '#aggregate',
  xAccessor: 'date',
  yAccessor: 'value',
  legend: ['Line 1', 'Line 2', 'Line 3'],
  legendTarget: '#aggregateLegend',
  voronoi: {
    aggregate: true
  }
})`

export default class Lines extends Component {
  lineChart1 = null
  confidenceBand = null
  multilineChart = null
  aggregatedChart = null

  componentDidMount () {
    this.lineChart1 = new LineChart({
      data: fakeUsers1.map(entry => ({
        date: new Date(entry.date),
        value: entry.value
      })),
      width: 600,
      height: 200,
      yScale: {
        minValue: 0
      },
      target: '#fakeUsers1',
      area: true,
      xAccessor: 'date',
      yAccessor: 'value',
      tooltipFunction: point => `date: ${point.date.getDate()}.${point.date.getMonth() + 1}.${point.date.getFullYear()}, value: ${point.value}`
    })

    this.confidenceBand = new LineChart({
      data: confidence.map(entry => ({
        ...entry,
        date: new Date(entry.date)
      })),
      xAxis: {
        extendedTicks: true
      },
      yAxis: {
        tickFormat: 'percentage'
      },
      width: 600,
      height: 200,
      target: '#confidenceBand',
      confidenceBand: ['l', 'u']
    })

    this.multilineChart = new LineChart({
      data: fakeUsers2.map(fakeArray => fakeArray.map(fakeEntry => ({
        ...fakeEntry,
        date: new Date(fakeEntry.date)
      }))),
      width: 600,
      height: 200,
      target: '#fakeUsers2',
      xAccessor: 'date',
      yAccessor: 'value',
      legend: ['Line 1', 'Line 2', 'Line 3'],
      legendTarget: '#fakeUsers2Legend'
    })

    this.aggregatedChart = new LineChart({
      data: fakeUsers2.map(fakeArray => fakeArray.map(fakeEntry => ({
        ...fakeEntry,
        date: new Date(fakeEntry.date)
      }))),
      width: 600,
      height: 200,
      target: '#aggregate',
      xAccessor: 'date',
      yAccessor: 'value',
      legend: ['Line 1', 'Line 2', 'Line 3'],
      legendTarget: '#aggregateLegend',
      voronoi: {
        aggregate: true
      }
    })
  }

  render () {
    return (
      <div className="container mx-auto mt-8">
        <ExampleContainer
          title="Line Chart"
          description="This is a simple line chart. You can remove the area portion by adding area: false to the arguments list."
          id="fakeUsers1"
          code={codeChart1}
        />

        <ExampleContainer
          title="Confidence Band"
          description="This is an example of a graphic with a confidence band and extended x-axis ticks enabled."
          id="confidenceBand"
          code={codeConfidence}
        />

        <ExampleContainer
          title="Multiple Lines"
          description="This line chart contains multiple lines."
          id="fakeUsers2"
          legendId="fakeUsers2Legend"
          code={codeMultiline}
        />

        <ExampleContainer
          title="Aggregate Rollover"
          description="One rollover for all lines."
          id="aggregate"
          legendId="aggregateLegend"
          code={codeAggregate}
        />
      </div>
    )
  }
}
