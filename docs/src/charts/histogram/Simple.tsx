import { HistogramChart } from 'metrics-graphics'
import Container from '../../components/Container'
import ufoData from '../../data/ufoDates.json'

const Simple = () => (
  <Container
    title="Difference in UFO Sighting and Reporting Dates (in months)"
    description="Semi-real data about the reported differences between the supposed sighting of a UFO and the date it was reported."
    chartRenderer={(ref) =>
      new HistogramChart({
        data: ufoData.map((date) => date / 30).sort(),
        width: 600,
        height: 200,
        binCount: 150,
        target: ref as any,
        brush: 'x' as any,
        yAxis: {
          extendedTicks: true
        },
        tooltipFunction: (bar) => `${bar.time} months, volume ${bar.count}`
      })
    }
    code={`new HistogramChart({
  data: ufoDates.map(date => (parseInt(date, 10) / 30)).sort(),
  width: 600,
  height: 200,
  right: 40,
  binCount: 150,
  target: '#histogramChart1',
  brush: 'x',
  yAxis: {
    extendedTicks: true
  },
  tooltipFunction: bar => \`\${bar.time} months, volume \${bar.count}\`
})`}
  />
)

export default Simple
