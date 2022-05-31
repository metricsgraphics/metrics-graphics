import { LineChart } from 'metrics-graphics'
import { PropsWithChildren } from 'react'
import Renderer from '../Renderer'
import fakeUsers from '../../../data/fakeUsers1.json'
import { formatCompact, formatDate } from '../../../helpers/format'

const Simple: React.FC<PropsWithChildren<unknown>> = ({ children }) => (
  <Renderer
    chartRenderer={(ref) =>
      new LineChart({
        data: [fakeUsers.map(({ date, value }) => ({ date: new Date(date), value }))],
        width: 600,
        height: 200,
        yScale: {
          minValue: 0
        },
        target: ref as any,
        brush: 'xy',
        area: true,
        xAccessor: 'date',
        yAccessor: 'value',
        tooltipFunction: (point) => `${formatDate(point.date)}: ${formatCompact(point.value)}`
      })
    }
  >
    {children}
  </Renderer>
)

export default Simple
