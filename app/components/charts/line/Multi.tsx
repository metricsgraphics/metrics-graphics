import { LineChart } from 'metrics-graphics'
import { PropsWithChildren } from 'react'
import Renderer from '../Renderer'
import fakeUsers from '../../../data/fakeUsers2.json'
import { formatCompact, formatDate } from '../../../helpers/format'

const Multi: React.FC<PropsWithChildren<unknown>> = ({ children }) => (
  <Renderer
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
        tooltipFunction: (point) => `${formatDate(point.date)}: ${formatCompact(point.value)}`
      })
    }
  >
    {children}
  </Renderer>
)

export default Multi
