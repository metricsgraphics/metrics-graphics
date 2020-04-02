import { Component } from 'preact'
import ScatterChart from 'mg2/src/js/charts/scatter'

import points1 from '../assets/data/points1'

const groupByArray = (xs, key) => xs.reduce((rv, x) => {
  let v = key instanceof Function ? key(x) : x[key]
  let el = rv.find((r) => r && r.key === v)
  if (el) el.values.push(x)
  else rv.push({ key: v, values: [x] })
  return rv
}, [])
const points2 = groupByArray(points1, 'v')

const Num = new Intl.NumberFormat('en', {
  maximumFractionDigits: 2
})

export default class Lines extends Component {
  scatterChart1 = null
  scatterChart2 = null
  scatterChart3 = null

  componentDidMount () {
    this.scatterChart1 = new ScatterChart({
      data: points1,
      width: 500,
      height: 200,
      target: '#scatterChart1',
      xAccessor: 'x',
      yAccessor: 'y',
      xRug: true,
      tooltipFunction: point => `${Num.format(point.x)} ${Num.format(point.y)}`
    })
    this.scatterChart2 = new ScatterChart({
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
    })
    this.scatterChart3 = new ScatterChart({
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
    })
  }

  render () {
    return (
      <div>
        <div className="example-container">
          <div>
            <p>Simple Scatterplot</p>
            <small>
            This is an example scatterplot, in which we have enabled rug plots on the y-axis by setting the rug option to true.
            </small>
            <div id="scatterChart1" />
          </div>
          <div>
            <code><pre /></code>
          </div>
        </div>

        <div className="example-container">
          <div>
            <p>Multi-Category Scatterplot</p>
            <small>
            This scatterplot contains data of multiple categories.
            </small>
            <div id="scatterChart2" />
            <p className="text-center" id="scatterChart2Legend" />
          </div>
          <div>
            <code><pre /></code>
          </div>
        </div>

        <div className="example-container">
          <div>
            <p>Scatterplot with Size and Color</p>
            <small>
            Scatterplots have xAccessor, yAccessor and sizeAccessor.
            </small>
            <div id="scatterChart3" />
            <p className="text-center" id="scatterChart3Legend" />
          </div>
          <div>
            <code><pre /></code>
          </div>
        </div>
      </div>
    )
  }
}
