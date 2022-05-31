import { ScatterChart } from 'metrics-graphics'
import { PropsWithChildren } from 'react'
import Renderer from '../Renderer'
import points1 from '../../../data/points1.json'
import { formatDecimal } from '../../../helpers/format'

const Simple: React.FC<PropsWithChildren<unknown>> = ({ children }) => (
  <Renderer
    chartRenderer={(ref) =>
      new ScatterChart({
        data: [points1],
        width: 500,
        height: 200,
        target: ref as any,
        xAccessor: 'x',
        yAccessor: 'y',
        brush: 'xy',
        xRug: true,
        tooltipFunction: (point) => `${formatDecimal(point.x)} - ${formatDecimal(point.y)}`
      })
    }
  >
    {children}
  </Renderer>
)

export default Simple
