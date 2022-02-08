import { ScatterChart } from 'metrics-graphics'
import Container from '../../components/Container'
import points1 from '../../data/points1.json'
import { formatDecimal } from '../../helpers/format'

const Simple = () => (
  <Container
    title="Simple Scatterplot"
    description="This is an example scatterplot, in which we have enabled rug plots on the y-axis by setting the rug option to true."
    chartRenderer={(ref) =>
      new ScatterChart({
        data: [points1],
        width: 500,
        height: 200,
        target: ref as any,
        xAccessor: 'x',
        yAccessor: 'y',
        brush: true as any,
        xRug: true,
        tooltipFunction: (point) => `${formatDecimal(point.x)} - ${formatDecimal(point.y)}`
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
