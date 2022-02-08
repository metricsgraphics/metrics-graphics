import { LineChart } from 'metrics-graphics'
import Container from '../../components/Container'
import confidence from '../../data/confidenceBand.json'
import { formatDate, formatPercent } from '../../helpers/format'

const Confidence = () => (
  <Container
    title="Confidence Band"
    description="This is an example of a graph with a confidence band and extended x-axis ticks enabled."
    chartRenderer={(ref) =>
      new LineChart({
        data: [
          confidence.map((entry) => ({
            ...entry,
            date: new Date(entry.date)
          }))
        ],
        xAxis: {
          extendedTicks: true
        },
        yAxis: {
          tickFormat: 'percentage'
        },
        width: 600,
        height: 200,
        target: ref as any,
        confidenceBand: ['l', 'u'],
        tooltipFunction: (point) => `${formatDate(point.date)}: ${formatPercent(point.value)}`
      })
    }
    code={`new LineChart({
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
})`}
  />
)

export default Confidence
