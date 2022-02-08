import { ScatterChart } from 'metrics-graphics'
import Container from '../../components/Container'
import points1 from '../../data/points1.json'
import { formatDecimal } from '../../helpers/format'

const groupByArray = (xs: Array<any>, key: string) =>
  xs.reduce((rv, x) => {
    const v = x[key]
    const el = rv.find((r: any) => r && r.key === v)
    if (el) el.values.push(x)
    else rv.push({ key: v, values: [x] })
    return rv
  }, [])
const points2 = groupByArray(points1, 'v')

const Categories = () => (
  <Container
    title="Multi-Category Scatterplot"
    description="This scatterplot contains data of multiple categories."
    chartRenderer={(ref) =>
      new ScatterChart({
        data: points2.map((x: any) => x.values),
        legend: points2.map((x: any) => x.key),
        width: 500,
        height: 200,
        xAccessor: 'x',
        yAccessor: 'y',
        yRug: true,
        target: ref as any,
        tooltipFunction: (point) => `${formatDecimal(point.x)} - ${formatDecimal(point.y)}`
      })
    }
    code={`new ScatterChart({
  data: points2.map(x => x.values),
  legend: points2.map(x => x.key),
  width: 500,
  height: 200,
  target: '#scatterChart2',
  xAccessor: 'x',
  yAccessor: 'y',
  yRug: true,
  tooltipFunction: point => \`\${point.x} \${point.y}\`
})`}
  />
)

export default Categories
