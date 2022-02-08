import { LineChart } from 'metrics-graphics'
import Container from '../../components/Container'
import missing from '../../data/missing.json'
import { formatDate } from '../../helpers/format'

const Broken = () => (
  <Container
    title="Broken Lines (Missing Data Points)"
    description="You can hide individual data points on a particular attribute by setting the defined accessor (which has to return true for visible points). Data points whose y-accessor values are null are also hidden."
    code={`new LineChart({
  data: missing.map(entry => ({
    date: new Date(entry.date),
    value: entry.value
  })),
  width: 600,
  height: 200,
  target: '#missing',
  defined: d => !d.dead,
  area: true
})`}
    chartRenderer={(ref) =>
      new LineChart({
        data: [missing.map((e) => ({ ...e, date: new Date(e.date) }))],
        width: 600,
        height: 200,
        target: ref as any,
        defined: (d) => !d.dead,
        area: true,
        tooltipFunction: (point) => `${formatDate(point.date)}: ${point.value}`
      })
    }
  />
)

export default Broken
