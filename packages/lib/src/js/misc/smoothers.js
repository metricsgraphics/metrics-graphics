import { select } from 'd3-selection'
import { max, min, mean, zip, quantile, sum, range } from 'd3-array'
import { line } from 'd3-shape'
import { getSvgChildOf } from './utility'

export function addLs ({ target, data, accessor, xScale, yScale, lsLine }) {
  const svg = getSvgChildOf(target)
  data = data[0]
  const minX = min(data, accessor)
  const maxX = max(data, accessor)

  select(target).selectAll('.mg-least-squares-line').remove()

  svg.append('svg:line')
    .attr('x1', xScale(minX))
    .attr('x2', xScale(maxX))
    .attr('y1', yScale(lsLine.fit(minX)))
    .attr('y2', yScale(lsLine.fit(maxX)))
    .attr('class', 'mg-least-squares-line')
}

export function addLowess ({ target, lowessLine, xScale, yScale, interpolate }) {
  const svg = getSvgChildOf(target)
  const lowess = lowessLine

  const lineGenerator = line()
    .x(xScale)
    .y(yScale)
    .interpolate(interpolate)

  svg.append('path')
    .attr('d', lineGenerator(lowess))
    .classed('mg-lowess-line', true)
}

export function lowessRobust (x, y, alpha, inc) {
  // Used http://www.unc.edu/courses/2007spring/biol/145/001/docs/lectures/Oct27.html
  // for the clear explanation of robust lowess.

  // calculate the the first pass.
  let _l
  let r = new Array(x.length).fill(1)
  _l = this.calculateLowessFit(x, y, alpha, inc, r)
  let xProto = _l.x
  let yProto = _l.y

  // Now, take the fit, recalculate the weights, and re-run LOWESS using r*w instead of w.
  for (let i = 0; i < 100; i++) {
    r = zip(yProto, y).map(yi => Math.abs(yi[1] - yi[0]))

    const q = quantile(r.sort(), 0.5)

    r = r.map(ri => this.bisquareWeight(ri / (6 * q)))

    _l = this.calculateLowessFit(x, y, alpha, inc, r)
    xProto = _l.x
    yProto = _l.y
  }

  return zip(xProto, yProto).map(d => ({ x: d[0], y: d[1] }))
}

export function leastSquares (x_, y_) {
  const x = x_[0] instanceof Date ? x_.map(d => d.getTime()) : x_
  const y = y_[0] instanceof Date ? y_.map(d => d.getTime()) : y_

  const xHat = mean(x)
  const yHat = mean(y)
  let numerator = 0
  let denominator = 0

  for (let i = 0; i < x.length; i++) {
    const xi = x[i]
    const yi = y[i]
    numerator += (xi - xHat) * (yi - yHat)
    denominator += (xi - xHat) * (xi - xHat)
  }

  const beta = numerator / denominator
  const x0 = yHat - beta * xHat

  return {
    x0,
    beta,
    fit: d => x0 + x * beta
  }
}

export function powWeight (u, w) {
  return u >= 0 && u <= 1
    ? Math.pow(1 - Math.pow(u, w), w)
    : 0
}

export function bisquareWeight (u) { return powWeight(u, 2) }
export function tricubeWeight (u) { return powWeight(u, 3) }

export function neighborHoodWidth (x0, xis) { return max(xis, xi => Math.abs(x0, xi)) }
export function manhattan (x1, x2) { return Math.abs(x1 - x2) }

export function weightedMeans (wxy) {
  const wSum = sum(wxy.map(el => el.w))

  return {
    xBar: sum(wxy.map(el => el.w * el.x)) / wSum,
    yBar: sum(wxy.map(el => el.w * el.y)) / wSum
  }
}

export function weightedBeta (wxy, xBar, yBar) {
  const num = sum(wxy.map(el => Math.pow(el.w, 2) * (el.x - xBar) * (el.y - yBar)))
  const denom = sum(wxy.map(el => Math.pow(el.w, 2) * Math.pow(el.x - xBar, 2)))

  return num / denom
}

export function weightedLeastSquares (wxy) {
  const { xBar, yBar } = this.weightedMeans(wxy)
  const beta = this.weightedBeta(wxy, xBar, yBar)
  const x0 = yBar - beta * xBar

  return { beta, xBar, yBar, x0 }
}

export function calculateLowessFit (x, y, alpha, inc, residuals) {
  const k = Math.floor(x.length * alpha)

  const sortedX = x.slice()
  sortedX.sort((a, b) => b - a)

  const xMax = quantile(sortedX, 0.98)
  const xMin = quantile(sortedX, 0.02)

  const xy = zip(x, y, residuals).sort()

  const size = Math.abs(xMax - xMin) / inc

  const smallest = xMin
  const largest = xMax
  const xProto = range(smallest, largest, size)

  // for each prototype, find its fit.
  const yProto = []

  for (let i = 0; i < xProto.length; i++) {
    const ix = xProto[i]

    // get k closest neighbors.
    let xiNeighbors = xy.map(xyi => ([
      Math.abs(xyi[0] - ix),
      xyi[0],
      xyi[1],
      xyi[2]
    ])).sort().slice(0, k)

    // Get the largest distance in the neighbor set.
    const iDelta = max(xiNeighbors)[0]

    // Prepare the weights for mean calculation and WLS.

    xiNeighbors = xiNeighbors.map(wxy => ({
      w: this.tricubeWeight(wxy[0] / iDelta) * wxy[3],
      x: wxy[1],
      y: wxy[2]
    }))

    // Find the weighted least squares, obviously.
    const { x0, beta } = this.weightedLeastSquares(xiNeighbors)

    yProto.push(x0 + beta * ix)
  }

  return { x: xProto, y: yProto }
}
