import { LineChart } from 'metrics-graphics'
import Container from '../../components/Container'
import fakeUsers from '../../data/fakeUsers1.json'
import { formatCompact, formatDate } from '../../helpers/format'

const Active = () => (
  <Container
    title="Active Points"
    description="This line chart displays pre-defined active points"
    code={`new LineChart({
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
})`}
    chartRenderer={(ref) =>
      new LineChart({
        data: [
          fakeUsers.map((entry, i) => ({
            ...entry,
            date: new Date(entry.date),
            active: i % 5 === 0
          }))
        ],
        width: 600,
        height: 200,
        target: ref as any,
        activeAccessor: 'active',
        activePoint: {
          radius: 2
        },
        tooltipFunction: (point) => `${formatDate(point.date)}: ${formatCompact(point.value)}`
      })
    }
  />
)

export default Active
