import { LineChart } from 'metrics-graphics'
import Container from '../../components/Container'
import fakeUsers from '../../data/fakeUsers1.json'
import { formatCompact, formatDate } from '../../helpers/format'

const Baseline = () => (
  <Container
    title="Baseline"
    description="Baselines are horizontal lines that can added at arbitrary points.'"
    code={`new LineChart({
  data: fakeUsers1.map(entry => ({
    date: new Date(entry.date),
    value: entry.value
  })),
  baselines: [{value: 160000000, label: 'a baseline'}],
  width: 600,
  height: 200,
  target: '#baselines'
})`}
    chartRenderer={(ref) =>
      new LineChart({
        data: [
          fakeUsers.map((entry) => ({
            ...entry,
            date: new Date(entry.date)
          }))
        ],
        baselines: [{ value: 160000000, label: 'a baseline' }],
        width: 600,
        height: 200,
        target: ref as any,
        tooltipFunction: (point) => `${formatDate(point.date)}: ${formatCompact(point.value)}`
      })
    }
  />
)

export default Baseline
