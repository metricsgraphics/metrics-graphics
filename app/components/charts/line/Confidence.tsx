import { LineChart } from 'metrics-graphics'
import { PropsWithChildren } from 'react'
import Renderer from '../Renderer'
import confidence from '../../../data/confidenceBand.json'
import { formatDate, formatPercent } from '../../../helpers/format'

const Confidence: React.FC<PropsWithChildren<unknown>> = ({ children }) => (
  <Renderer
    chartRenderer={(ref) =>
      new LineChart({
        data: [
          confidence.map((entry) => ({
            ...entry,
            date: new Date(entry.date)
          }))
        ],
        xAxis: {
          extendedTicks: true
        },
        yAxis: {
          tickFormat: 'percentage'
        },
        width: 600,
        height: 200,
        target: ref as any,
        confidenceBand: ['l', 'u'],
        tooltipFunction: (point) => `${formatDate(point.date)}: ${formatPercent(point.value)}`
      })
    }
  >
    {children}
  </Renderer>
)

export default Confidence
