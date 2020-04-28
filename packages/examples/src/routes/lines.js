import { Component } from 'preact'
import { LineChart } from 'metrics-graphics'

import fakeUsers1 from '../assets/data/fakeUsers1'
import fakeUsers2 from '../assets/data/fakeUsers2'
import confidence from '../assets/data/confidenceBand'
import missing from '../assets/data/missing'

import ExampleList from '../components/exampleList'

// pre-normalize fakeUsers1 dates
const fakeUsers = fakeUsers1.map(entry => ({
  ...entry,
  date: new Date(entry.date)
}))

const charts = [{
  title: 'Line Chart',
  description: 'This is a simple line chart. You can remove the area portion by adding area: false to the arguments list.',
  id: 'fakeUsers1',
  code: `new LineChart({
    data: fakeUsers1.map(entry => ({
      date: new Date(entry.date),
      value: entry.value
    })),
    width: 600,
    height: 200,
    yScale: {
      minValue: 0
    },
    brush: true,
    target: '#fakeUsers1',
    area: true,
    xAccessor: 'date',
    yAccessor: 'value'
  })`,
  object: {
    data: fakeUsers,
    width: 600,
    height: 200,
    yScale: {
      minValue: 0
    },
    brush: true,
    target: '#fakeUsers1',
    area: true,
    xAccessor: 'date',
    yAccessor: 'value',
    tooltipFunction: point => `date: ${point.date.getDate()}.${point.date.getMonth() + 1}.${point.date.getFullYear()}, value: ${point.value}`
  }
}, {
  title: 'Confidence Band',
  description: 'This is an example of a graphic with a confidence band and extended x-axis ticks enabled.',
  id: 'confidenceBand',
  code: `new LineChart({
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
  })`,
  object: {
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
  }
}, {
  title: 'Multiple Lines',
  description: 'This line chart contains multiple lines.',
  id: 'fakeUsers2',
  legendId: 'fakeUsers2Legend',
  code: `new LineChart({
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
  })`,
  object: {
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
  }
}, {
  title: 'Aggregate Rollover',
  description: 'One rollover for all lines.',
  id: 'aggregate',
  legendId: 'aggregateLegend',
  code: `new LineChart({
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
  })`,
  object: {
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
  }
}, {
  title: 'Broken Lines (Missing Data Points)',
  description: 'You can hide individual data points on a particular attribute by setting the defined accessor (which has to return true for visible points). Data points whose y-accessor values are null are also hidden.',
  id: 'missing',
  code: `new LineChart({
    data: missing.map(entry => ({
      date: new Date(entry.date),
      value: entry.value
    })),
    width: 600,
    height: 200,
    target: '#missing',
    defined: d => !d.dead,
    area: true
  })`,
  object: {
    data: missing.map(entry => ({
      ...entry,
      date: new Date(entry.date)
    })),
    width: 600,
    height: 200,
    target: '#missing',
    defined: d => !d.dead,
    area: true
  }
}, {
  title: 'Show active points on line chart',
  description: 'This line chart displays pre-defined active points',
  id: 'active',
  code: `new LineChart({
    data: fakeUsers1.map((entry, i) => ({
      ...entry,
      active: (i % 5 === 0),
      date: new Date(entry.date)
    })),
    width: 600,
    height: 200,
    target: '#active',
    activeAccessor: 'active',
    activePoint: {
      radius: 2
    }
  })`,
  object: {
    data: fakeUsers.map((entry, i) => ({
      ...entry,
      active: (i % 5 === 0)
    })),
    width: 600,
    height: 200,
    target: '#active',
    activeAccessor: 'active',
    activePoint: {
      radius: 2
    }
  }
}, {
  title: 'Baselines',
  description: 'Baselines are horizontal lines that can added at arbitrary points.',
  id: 'baselines',
  code: `new LineChart({
    data: fakeUsers1.map(entry => ({
      date: new Date(entry.date),
      value: entry.value
    })),
    baselines: [{value: 160000000, label: 'a baseline'}],
    width: 600,
    height: 200,
    target: '#baselines'
  })`,
  object: {
    data: fakeUsers,
    baselines: [{ value: 160000000, label: 'a baseline' }],
    width: 600,
    height: 200,
    target: '#baselines'
  }
}]

export default class Lines extends Component {
  componentDidMount () {
    this.chartInstances = charts.map(chart => new LineChart(chart.object))
  }

  render = () => (<ExampleList charts={charts} />)
}
