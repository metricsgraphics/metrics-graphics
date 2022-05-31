import { HistogramChart } from 'metrics-graphics'
import { PropsWithChildren } from 'react'
import Renderer from '../Renderer'
import ufoData from '../../../data/ufoDates.json'

const Simple: React.FC<PropsWithChildren<unknown>> = ({ children }) => (
  <Renderer
    chartRenderer={(ref) =>
      new HistogramChart({
        data: ufoData.map((date) => date / 30).sort(),
        width: 600,
        height: 200,
        binCount: 150,
        target: ref as any,
        brush: 'x',
        yAxis: {
          extendedTicks: true
        },
        tooltipFunction: (bar) => `${bar.time} months, volume ${bar.count}`
      })
    }
  >
    {children}
  </Renderer>
)

export default Simple
