import { LineChart } from 'metrics-graphics'
import { PropsWithChildren } from 'react'
import Renderer from '../Renderer'
import { formatCompact, formatDate } from '../../../helpers/format'

import fakeUsers from '../../../data/fakeUsers1.json'

const Active: React.FC<PropsWithChildren<unknown>> = ({ children }) => (
  <Renderer
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
  >
    {children}
  </Renderer>
)

export default Active
