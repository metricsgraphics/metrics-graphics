import { mouseoverText, clearMouseoverContainer } from '../common/rollover'
import { formatXMouseover, formatYMouseover } from '../misc/formatters'
import { inferType, getPlotLeft, getPlotTop, getSvgChildOf, addG } from '../misc/utility'
import { rawDataTransformation, processPoint } from '../misc/process'
import { init } from '../common/init'
import { MGScale } from '../common/scales'
import { getColorDomain, getColorRange, getSizeRange, xRug, addXLabel } from '../common/xAxis'
import { axisFactory, yRug, addYLabel } from '../common/yAxis'
import { addBrushFunction } from '../common/brush'
import { markers } from '../common/markers'
import { addLs } from '../misc/smoothers'
import { voronoi as d3voronoi } from 'd3-voronoi'
import { selectAll, select } from 'd3-selection'
import { globals } from '../common/dataGraphic'
import { windowListeners } from '../common/windowListeners'

function pointMouseover (args, svg, d) {
  const mouseover = mouseoverText(this.args, { svg })
  const row = mouseover.mouseover_row()

  if (this.args.colorAccessor !== null && args.colorType === 'category') {
    const label = d[args.colorAccessor]
    row.text(`${label}  `).bold().attr('fill', args.scaleFunctions.colorFunction(d))
  }

  colorPointMouseover(this.args, row.text('\u25CF   ').elem, d) // point shape

  row.text(formatXMouseover(this.args, d)) // x
  row.text(formatYMouseover(this.args, d, args.timeSeries === false))
}

function colorPointMouseover ({ colorAccessor, scaleFunctions }, elem, d) {
  if (colorAccessor !== null) {
    elem.attr('fill', scaleFunctions.colorFunction(d))
    elem.attr('stroke', scaleFunctions.colorFunction(d))
  } else {
    elem.classed('mg-points-mono', true)
  }
}

function filterOutPlotBounds (data, args) {
  // maxX, minX, maxY, minY;
  const x = args.xAccessor
  const y = args.yAccessor
  const newData = data.filter(d => (this.args.minX === null || d[x] >= args.minX) &&
      (this.args.maxX === null || d[x] <= args.maxX) &&
      (this.args.minY === null || d[y] >= args.minY) &&
      (this.args.maxY === null || d[y] <= args.maxY))
  return newData
}

export default class PointChart {
  constructor (args) {
    this.args = args

    // infer yAxis and xAxis type;
    args.xAxisType = inferType(this.args, 'x')
    args.yAxisType = inferType(this.args, 'y')

    rawDataTransformation(this.args)

    processPoint(this.args)
    init(this.args)

    if (this.args.xAxisType === 'categorical') {
      MGScale(this.args)
        .namespace('x')
        .categoricalDomainFromData()
        .categoricalRangeBands([0, args.xgroup_height], args.xgroup_accessor === null)

      if (this.args.xgroup_accessor) {
        new MGScale(this.args)
          .namespace('xgroup')
          .categoricalDomainFromData()
          .categoricalRangeBands('bottom')
      } else {
        args.scales.XGROUP = () => getPlotLeft(this.args)
        args.scaleFunctions.xgroupf = () => getPlotLeft(this.args)
      }

      args.scaleFunctions.xoutf = d => args.scaleFunctions.xf(d) + args.scaleFunctions.xgroupf(d)
    } else {
      MGScale(this.args)
        .namespace('x')
        .inflateDomain(true)
        .zeroBottom(this.args.yAxisType === 'categorical')
        .numericalDomainFromData((this.args.baselines || []).map(d => d[args.xAccessor]))
        .numericalRange('bottom')

      args.scaleFunctions.xoutf = args.scaleFunctions.xf
    }

    // y-scale generation. This needs to get simplified.
    if (this.args.yAxisType === 'categorical') {
      MGScale(this.args)
        .namespace('y')
        .zeroBottom(true)
        .categoricalDomainFromData()
        .categoricalRangeBands([0, args.yGroupHeight], true)

      if (this.args.yGroupAccessor) {
        new MGScale(this.args)
          .namespace('ygroup')
          .categoricalDomainFromData()
          .categoricalRangeBands('left')
      } else {
        args.scales.YGROUP = () => getPlotTop(this.args)
        args.scaleFunctions.yGroupFunction = () => getPlotTop(this.args)
      }
      args.scaleFunctions.youtf = d => args.scaleFunctions.yf(d) + args.scaleFunctions.yGroupFunction(d)
    } else {
      const baselines = (this.args.baselines || []).map(d => d[args.yAccessor])
      MGScale(this.args)
        .namespace('y')
        .inflateDomain(true)
        .zeroBottom(this.args.xAxisType === 'categorical')
        .numericalDomainFromData(baselines)
        .numericalRange('left')

      args.scaleFunctions.youtf = d => args.scaleFunctions.yf(d)
    }

    /// //// COLOR accessor
    if (this.args.colorAccessor !== null) {
      const colorScale = MGScale(this.args).namespace('color')
      if (this.args.colorType === 'number') {
        // do the color scale.
        // etiher get color range, or what.
        colorScale
          .numericalDomainFromData(getColorDomain(this.args))
          .numericalRange(getColorRange(this.args))
          .clamp(true)
      } else {
        if (this.args.colorDomain) {
          colorScale
            .categoricalDomain(this.args.colorDomain)
            .categoricalRange(this.args.colorRange)
        } else {
          colorScale
            .categoricalDomainFromData()
            .categoricalColorRange()
        }
      }
    }

    if (this.args.sizeAccessor) {
      new MGScale(this.args).namespace('size')
        .numericalDomainFromData()
        .numericalRange(getSizeRange(this.args))
        .clamp(true)
    }

    axisFactory(this.args)
      .namespace('x')
      .type(this.args.xAxisType)
      .zeroLine(this.args.yAxisType === 'categorical')
      .position(this.args.xAxis_position)
      .rug(xRug(this.args))
      .label(addXLabel)
      .draw()

    axisFactory(this.args)
      .namespace('y')
      .type(this.args.yAxisType)
      .zeroLine(this.args.xAxisType === 'categorical')
      .position(this.args.yAxis_position)
      .rug(yRug(this.args))
      .label(addYLabel)
      .draw()

    this.mainPlot()
    this.markers()
    this.rollover()
    this.windowListeners()
    if (this.args.brush) addBrushFunction(this.args)
  }

  mainPlot () {
    const svg = getSvgChildOf(this.args.target)

    const data = filterOutPlotBounds(this.args.data[0], this.args)
    // remove the old points, add new one
    svg.selectAll('.mg-points').remove()

    const g = svg.append('g')
      .classed('mg-points', true)

    const pts = g.selectAll('circle')
      .data(data)
      .enter().append('circle')
      .attr('class', (d, i) => `path-${i}`)
      .attr('cx', this.args.scaleFunctions.xoutf)
      .attr('cy', d => this.args.scaleFunctions.youtf(d))

    let highlights
    svg.selectAll('.mg-highlight').remove()
    if (this.args.highlight && typeof this.args.highlight === 'function') {
      highlights = svg.append('g')
        .classed('mg-highlight', true)
        .selectAll('circle')
        .data(data.filter(this.args.highlight))
        .enter().append('circle')
        .attr('cx', this.args.scaleFunctions.xoutf)
        .attr('cy', d => this.args.scaleFunctions.youtf(d))
    }

    const elements = [pts].concat(highlights ? [highlights] : [])
    // are we coloring our points, or just using the default color?
    if (this.args.colorAccessor !== null) {
      elements.forEach(e => e.attr('fill', this.args.scaleFunctions.colorFunction).attr('stroke', this.args.scaleFunctions.colorFunction))
    } else {
      elements.forEach(e => e.classed('mg-points-mono', true))
    }

    pts.attr('r', (this.args.sizeAccessor !== null) ? this.args.scaleFunctions.sizef : this.args.pointSize)
    if (highlights) {
      highlights.attr('r', (this.args.sizeAccessor !== null) ? (d, i) => this.args.scaleFunctions.sizef(d, i) + 2 : this.args.pointSize + 2)
    }
  }

  markers () {
    markers(this.args)
    if (this.args.leastSquares) {
      addLs(this.args)
    }
  }

  rollover () {
    const svg = getSvgChildOf(this.args.target)

    if (svg.selectAll('.mg-active-datapoint-container').nodes().length === 0) {
      addG(svg, 'mg-active-datapoint-container')
    }

    // remove the old rollovers if they already exist
    svg.selectAll('.mg-voronoi').remove()

    // add rollover paths
    const voronoi = d3voronoi()
      .x(this.args.scaleFunctions.xoutf)
      .y(this.args.scaleFunctions.youtf)
      .extent([
        [this.args.buffer, this.args.buffer + (this.args.title ? this.args.titleYPosition : 0)],
        [this.args.width - this.args.buffer, this.args.height - this.args.buffer]
      ])

    const paths = svg.append('g')
      .attr('class', 'mg-voronoi')

    paths.selectAll('path')
      .data(voronoi.polygons(filterOutPlotBounds(this.args.data[0], this.args)))
      .enter().append('path')
      .attr('d', d => d == null ? null : `M${d.join(',')}Z`)
      .attr('class', (d, i) => `path-${i}`)
      .style('fill-opacity', 0)
      .on('click', this.rolloverClick(this.args))
      .on('mouseover', this.rolloverOn(this.args))
      .on('mouseout', this.rolloverOff(this.args))
      .on('mousemove', this.rolloverMove(this.args))

    if (this.args.data[0].length === 1) {
      pointMouseover(this.args, svg, this.args.data[0][0])
    }
  }

  rolloverClick () {
    return (d, i) => {
      if (this.args.click) {
        this.args.click(d, i)
      }
    }
  }

  rolloverOn () {
    const svg = getSvgChildOf(this.args.target)

    return (d, i) => {
      svg.selectAll('.mg-points circle')
        .classed('selected', false)

      // highlight active point
      const pts = svg.selectAll(`.mg-points circle.path-${i}`)
        .classed('selected', true)

      if (this.args.sizeAccessor) {
        pts.attr('r', di => this.args.scaleFunctions.sizef(di) + this.args.active_pointSize_increase)
      } else {
        pts.attr('r', this.args.pointSize + this.args.active_pointSize_increase)
      }

      // trigger mouseover on all points for this class name in .linked charts
      if (this.args.linked && !globals.link) {
        globals.link = true

        // trigger mouseover on matching point in .linked charts
        selectAll(`.mg-voronoi .path-${i}`)
          .each(() => {
            select(this).on('mouseover')(d, i)
          })
      }

      if (this.args.show_rollover_text) {
        pointMouseover(this.args, svg, d.data)
      }

      if (this.args.mouseover) {
        this.args.mouseover(d, i)
      }
    }
  }

  rolloverOff () {
    const svg = getSvgChildOf(this.args.target)

    return (d, i) => {
      if (this.args.linked && globals.link) {
        globals.link = false

        selectAll(`.mg-voronoi .path-${i}`)
          .each(() => {
            select(this).on('mouseout')(d, i)
          })
      }

      // reset active point
      const pts = svg.selectAll('.mg-points circle')
        .classed('unselected', false)
        .classed('selected', false)

      if (this.args.sizeAccessor) {
        pts.attr('r', this.args.scaleFunctions.sizef)
      } else {
        pts.attr('r', this.args.pointSize)
      }

      // reset active data point text
      if (this.args.data[0].length > 1) clearMouseoverContainer(svg)

      if (this.args.mouseout) {
        this.args.mouseout(d, i)
      }
    }
  }

  rolloverMove () {
    return (d, i) => {
      if (this.args.mousemove) {
        this.args.mousemove(d, i)
      }
    }
  }

  windowListeners () { windowListeners(this.args) }
}

export const options = {
  colorAccessor: [null, 'string'], // the data element to use to map points to colors
  colorRange: [null, 'array'], // the range used to color different groups of points
  colorType: ['number', ['number', 'category']], // specifies whether the color scale is quantitative or qualitative
  pointSize: [2.5, 'number'], // the radius of the dots in the scatterplot
  sizeAccessor: [null, 'string'], // should point sizes be mapped to data
  sizeRange: [null, 'array'], // the range of point sizes
  lowess: [false, 'boolean'], // specifies whether to show a lowess line of best-fit
  leastSquares: [false, 'boolean'], // specifies whether to show a least-squares line of best-fit
  yCategoricalShowGuides: [true, 'boolean'],
  x_categorical_show_guides: [true, 'boolean'],
  buffer: [16, 'string'],
  label_accessor: [null, 'boolean'],
  sizeDomain: [null, 'array'],
  colorDomain: [null, 'array'],
  active_pointSize_increase: [1, 'number'],
  highlight: [null, 'function'] // if this callback function returns true, the selected point will be highlighted
}
