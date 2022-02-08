import { LineChart } from 'metrics-graphics'
import Container from '../../components/Container'
import fakeUsers from '../../data/fakeUsers2.json'
import { formatCompact, formatDate } from '../../helpers/format'

const Aggregated = () => (
  <Container
    title="Aggregate Rollover"
    description="One rollover for all lines."
    chartRenderer={(ref) =>
      new LineChart({
        data: fakeUsers.map((fakeArray) =>
          fakeArray.map((fakeEntry) => ({
            ...fakeEntry,
            date: new Date(fakeEntry.date)
          }))
        ),
        width: 600,
        height: 200,
        target: ref as any,
        xAccessor: 'date',
        yAccessor: 'value',
        legend: ['Line 1', 'Line 2', 'Line 3'],
        voronoi: {
          aggregate: true
        },
        tooltipFunction: (point) => `${formatDate(point.date)}: ${formatCompact(point.value)}`
      })
    }
    code={`new LineChart({
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
  voronoi: {
    aggregate: true
  }
})`}
  />
)

export default Aggregated
