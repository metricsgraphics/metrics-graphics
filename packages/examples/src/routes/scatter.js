import { Component } from 'preact'
import ScatterChart from 'mg2/src/js/charts/scatter'
import ExampleContainer from '../components/exampleContainer'

import points1 from '../assets/data/points1'

const groupByArray = (xs, key) => xs.reduce((rv, x) => {
  const v = key instanceof Function ? key(x) : x[key]
  const el = rv.find((r) => r && r.key === v)
  if (el) el.values.push(x)
  else rv.push({ key: v, values: [x] })
  return rv
}, [])
const points2 = groupByArray(points1, 'v')

const Num = new Intl.NumberFormat('en', {
  maximumFractionDigits: 2
})

const charts = [{
  title: 'Simple Scatterplot',
  description: 'This is an example scatterplot, in which we have enabled rug plots on the y-axis by setting the rug option to true.',
  id: 'scatterChart1',
  code: `new ScatterChart({
    data: points1,
    width: 500,
    height: 200,
    target: '#scatterChart1',
    xAccessor: 'x',
    yAccessor: 'y',
    xRug: true,
    tooltipFunction: point => \`\${point.x} \${point.y}\`
  })`,
  object: {
    data: points1,
    width: 500,
    height: 200,
    target: '#scatterChart1',
    xAccessor: 'x',
    yAccessor: 'y',
    xRug: true,
    tooltipFunction: point => `${Num.format(point.x)} ${Num.format(point.y)}`
  }
}, {
  title: 'Multi-Category Scatterplot',
  description: 'This scatterplot contains data of multiple categories.',
  id: 'scatterChart2',
  code: `new ScatterChart({
    data: points2.map(x => x.values),
    legend: points2.map(x => x.key),
    width: 500,
    height: 200,
    target: '#scatterChart2',
    xAccessor: 'x',
    yAccessor: 'y',
    yRug: true,
    tooltipFunction: point => \`\${point.x} \${point.y}\`,
    legendTarget: '#scatterChart2Legend'
  })`,
  object: {
    data: points2.map(x => x.values),
    legend: points2.map(x => x.key),
    width: 500,
    height: 200,
    target: '#scatterChart2',
    xAccessor: 'x',
    yAccessor: 'y',
    yRug: true,
    tooltipFunction: point => `${Num.format(point.x)} ${Num.format(point.y)}`,
    legendTarget: '#scatterChart2Legend'
  }
}, {
  title: 'Scatterplot with Size and Color',
  description: 'Scatterplots have xAccessor, yAccessor and sizeAccessor.',
  id: 'scatterChart3',
  legendId: 'scatterChart3Legend',
  code: `new ScatterChart({
    data: points2.map(x => x.values),
    legend: points2.map(x => x.key),
    width: 500,
    height: 200,
    target: '#scatterChart3',
    xAccessor: 'x',
    yAccessor: 'y',
    sizeAccessor: x => Math.abs(x.w) * 3,
    tooltipFunction: point => \`x: \${point.x} y: \${point.y} size: \${point.w}\`,
    legendTarget: '#scatterChart3Legend'
  })`,
  object: {
    data: points2.map(x => x.values),
    legend: points2.map(x => x.key),
    width: 500,
    height: 200,
    target: '#scatterChart3',
    xAccessor: 'x',
    yAccessor: 'y',
    sizeAccessor: x => Math.abs(x.w) * 3,
    tooltipFunction: point => `x: ${Num.format(point.x)} y: ${Num.format(point.y)} size: ${Num.format(point.w)}`,
    legendTarget: '#scatterChart3Legend'
  }
}]

export default class Scatter extends Component {
  chartInstances = []

  componentDidMount () {
    this.chartInstances = charts.map(chart => new ScatterChart(chart.object))
  }

  render = () => (<div className="container mx-auto mt-8">
    {charts.map(chart => (
      <ExampleContainer
        title={chart.title}
        description={chart.description}
        id={chart.id}
        legendId={chart.legendId}
        code={chart.code}
      />
    ))}
  </div>)
}
