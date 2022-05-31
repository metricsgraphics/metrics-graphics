import { LineChart } from 'metrics-graphics'
import { PropsWithChildren } from 'react'
import Renderer from '../Renderer'
import { formatDate } from '../../../helpers/format'

import missing from '../../../data/missing.json'

const Broken: React.FC<PropsWithChildren<unknown>> = ({ children }) => (
  <Renderer
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
  >
    {children}
  </Renderer>
)

export default Broken
