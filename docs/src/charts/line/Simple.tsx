import { LineChart } from 'metrics-graphics'
import Container from '../../components/Container'
import fakeUsers from '../../data/fakeUsers1.json'
import { formatCompact, formatDate } from '../../helpers/format'

const Simple = () => (
  <Container
    title="Line Chart"
    description="This is a simple line chart. You can remove the area portion by adding area: false to the arguments list."
    chartRenderer={(ref) =>
      new LineChart({
        data: [fakeUsers.map(({ date, value }) => ({ date: new Date(date), value }))],
        width: 600,
        height: 200,
        yScale: {
          minValue: 0
        },
        target: ref as any,
        brush: 'xy' as any,
        area: true,
        xAccessor: 'date',
        yAccessor: 'value',
        tooltipFunction: (point) => `date: ${formatDate(point.date)}: ${formatCompact(point.value)}`
      })
    }
    code={`new LineChart({
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
})`}
  />
)

export default Simple
