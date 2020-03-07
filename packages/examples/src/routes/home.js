import { Component } from 'preact'
import { LineChart } from 'mg2'

import sightings from '../assets/data/ufoSightings'

class Home extends Component {
  lineChart = null

  componentDidMount () {
    this.lineChart = new LineChart({
      data: sightings,
      markers: [{ year: 1964, label: '"The Creeping Terror" released' }],
      width: 650,
      height: 180,
      target: '#ufo-sightings',
      xAccessor: 'year',
      yAccessor: 'sightings',
      area: true,
      yScale: {
        minValue: 0
      },
      xAxis: {
        extendedTicks: true,
        label: 'Year',
        tickFormat: '.4r'
      },
      yAxis: {
        label: 'Count'
      }
    })
  }

  render () {
    return <div class="w-full">
      <p className="text-lg italic max-w-2xl mx-auto">
        MetricsGraphics is a library built on top of <a href="https://d3js.org">D3</a> that is optimized for visualizing and laying out time-series data. It provides a simple way to produce common types of graphics in a principled, consistent and responsive way.
      </p>
      <div class="my-12 mx-auto max-w-2xl">
        <p className="font-bold">UFO Sightings</p>
        <p className="text-xs italic text-gray-700 mb-2">
          Yearly UFO sightings from the year 1945 to 2010.
        </p>
        <div id="ufo-sightings" />
      </div>
    </div>
  }
}

export default Home
