import { Component } from 'preact'
import { LineChart } from 'mg2'

import data from '../../assets/data/fakeUsers1'

export default class Lines extends Component {
  lineChart1 = null

  componentDidMount () {
    this.lineChart1 = new LineChart({
      data: data.map(entry => ({
        date: new Date(entry.date),
        value: entry.value
      })),
      width: 600,
      height: 200,
      yScale: {
        minValue: 0
      },
      target: '#fake_users1',
      area: true,
      xAccessor: 'date',
      yAccessor: 'value'
    })
  }

  // Note: `user` comes from the URL, courtesy of our router
  render () {
    return (
      <div>
        <div className="flex">
          <div className="flex-1 pr-2">
            <p className="font-bold">Line Chart</p>
            <p className="text-xs italic text-gray-700 mb-2">This is a simple line chart. You can remove the area portion by adding area: false to the arguments list.</p>
            <div id="fake_users1" />
          </div>
          <div className="flex-1 pl-2">
            <code><pre>{`new LineChart({
  data: data.map(entry => ({
    date: new Date(entry.date),
    value: entry.value
  })),
  width: 600,
  height: 200,
  yScale: {
    minValue: 0
  },
  target: '#fake_users1',
  area: true,
  xAccessor: 'date',
  yAccessor: 'value'
})`}</pre></code>
          </div>
        </div>
      </div>
    )
  }
}
