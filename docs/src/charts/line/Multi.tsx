import { LineChart } from 'metrics-graphics'
import Container from '../../components/Container'
import fakeUsers from '../../data/fakeUsers2.json'
import { formatCompact, formatDate } from '../../helpers/format'

const Multi = () => (
  <Container
    title="Multiple Lines"
    description="This line chart contains multiple lines."
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
        legendTarget: '#fakeUsers2Legend',
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
  target: '#fakeUsers2',
  xAccessor: 'date',
  yAccessor: 'value',
  legend: ['Line 1', 'Line 2', 'Line 3'],
  legendTarget: '#fakeUsers2Legend'
})`}
  />
)

export default Multi
