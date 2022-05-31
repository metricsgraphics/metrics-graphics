import { ScatterChart } from 'metrics-graphics'
import { PropsWithChildren } from 'react'
import Renderer from '../Renderer'
import points1 from '../../../data/points1.json'
import { formatDecimal } from '../../../helpers/format'

const groupByArray = (xs: Array<any>, key: string) =>
  xs.reduce((rv, x) => {
    const v = x[key]
    const el = rv.find((r: any) => r && r.key === v)
    if (el) el.values.push(x)
    else rv.push({ key: v, values: [x] })
    return rv
  }, [])
const points2 = groupByArray(points1, 'v')

const Complex: React.FC<PropsWithChildren<unknown>> = ({ children }) => (
  <Renderer
    chartRenderer={(ref) =>
      new ScatterChart({
        data: points2.map((x: any) => x.values),
        legend: points2.map((x: any) => x.key),
        width: 500,
        height: 200,
        target: ref as any,
        xAccessor: 'x',
        yAccessor: 'y',
        sizeAccessor: (x: any) => Math.abs(x.w) * 3,
        tooltipFunction: (point) => `${formatDecimal(point.x)} - ${formatDecimal(point.y)}: ${formatDecimal(point.w)}`
      })
    }
  >
    {children}
  </Renderer>
)

export default Complex
