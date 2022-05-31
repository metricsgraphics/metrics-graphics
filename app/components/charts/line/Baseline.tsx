import { LineChart } from 'metrics-graphics'
import { PropsWithChildren } from 'react'
import Renderer from '../Renderer'
import { formatCompact, formatDate } from '../../../helpers/format'

import fakeUsers from '../../../data/fakeUsers1.json'

const Baseline: React.FC<PropsWithChildren<unknown>> = ({ children }) => (
  <Renderer
    chartRenderer={(ref) =>
      new LineChart({
        data: [
          fakeUsers.map((entry) => ({
            ...entry,
            date: new Date(entry.date)
          }))
        ],
        baselines: [{ value: 160000000, label: 'a baseline' }],
        width: 600,
        height: 200,
        target: ref as any,
        tooltipFunction: (point) => `${formatDate(point.date)}: ${formatCompact(point.value)}`
      })
    }
  >
    {children}
  </Renderer>
)

export default Baseline
