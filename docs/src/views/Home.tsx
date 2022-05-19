import { useEffect, useRef } from 'react'
import { LineChart } from 'metrics-graphics'
import sightings from '../data/ufoSightings.json'

const Home: React.FC = () => {
  const chartRef = useRef(null)
  useEffect(() => {
    if (!chartRef.current) return
    const lineChart = new LineChart({
      data: [sightings],
      markers: [{ year: 1964, label: '"The Creeping Terror" released' }],
      width: 650,
      height: 180,
      target: chartRef.current as any,
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
  }, [chartRef])
  return (
    <div className="max-w-4xl mx-auto">
      <p className="text-lg italic mb-4">
        MetricsGraphics is a library built on top of D3 that is optimized for visualizing and laying out time-series
        data. It provides a simple way to produce common types of graphics in a principled, consistent and responsive
        way.
      </p>
      <div className="flex justify-center" ref={chartRef} />
    </div>
  )
}

export default Home
