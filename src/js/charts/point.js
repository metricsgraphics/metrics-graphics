function point_mouseover (args, svg, d) {
  const mouseover = mouseoverText(args, { svg })
  const row = mouseover.mouseover_row()

  if (args.colorAccessor !== null && args.colorType === 'category') {
    const label = d[args.colorAccessor]
    row.text(`${label}  `).bold().attr('fill', args.scaleFunctions.colorFunction(d))
  }

  mg_color_point_mouseover(args, row.text('\u25CF   ').elem, d) // point shape

  row.text(formatXMouseover(args, d)) // x
  row.text(formatYMouseover(args, d, args.timeSeries === false))
}

function mg_color_point_mouseover ({ colorAccessor, scaleFunctions }, elem, d) {
  if (colorAccessor !== null) {
    elem.attr('fill', scaleFunctions.colorFunction(d))
    elem.attr('stroke', scaleFunctions.colorFunction(d))
  } else {
    elem.classed('mg-points-mono', true)
  }
}

{
  function mg_filter_out_plot_bounds (data, args) {
    // maxX, minX, maxY, minY;
    const x = args.xAccessor
    const y = args.yAccessor
    const new_data = data.filter(d => (args.minX === null || d[x] >= args.minX) &&
      (args.maxX === null || d[x] <= args.maxX) &&
      (args.minY === null || d[y] >= args.minY) &&
      (args.maxY === null || d[y] <= args.maxY))
    return new_data
  }

  function pointChart (args) {
    this.init = function (args) {
      this.args = args

      // infer yAxis and xAxis type;
      args.xAxis_type = inferType(args, 'x')
      args.yAxis_type = inferType(args, 'y')

      rawDataTransformation(args)

      processPoint(args)
      init(args)

      let xMaker, yMaker

      if (args.xAxis_type === 'categorical') {
        xMaker = MGScale(args)
          .namespace('x')
          .categoricalDomainFromData()
          .categoricalRangeBands([0, args.xgroup_height], args.xgroup_accessor === null)

        if (args.xgroup_accessor) {
          new MGScale(args)
            .namespace('xgroup')
            .categoricalDomainFromData()
            .categoricalRangeBands('bottom')
        } else {
          args.scales.XGROUP = () => getPlotLeft(args)
          args.scaleFunctions.xgroupf = () => getPlotLeft(args)
        }

        args.scaleFunctions.xoutf = d => args.scaleFunctions.xf(d) + args.scaleFunctions.xgroupf(d)
      } else {
        xMaker = MGScale(args)
          .namespace('x')
          .inflateDomain(true)
          .zeroBottom(args.yAxis_type === 'categorical')
          .numericalDomainFromData((args.baselines || []).map(d => d[args.xAccessor]))
          .numericalRange('bottom')

        args.scaleFunctions.xoutf = args.scaleFunctions.xf
      }

      // y-scale generation. This needs to get simplified.
      if (args.yAxis_type === 'categorical') {
        yMaker = MGScale(args)
          .namespace('y')
          .zeroBottom(true)
          .categoricalDomainFromData()
          .categoricalRangeBands([0, args.yGroupHeight], true)

        if (args.yGroupAccessor) {
          new MGScale(args)
            .namespace('ygroup')
            .categoricalDomainFromData()
            .categoricalRangeBands('left')
        } else {
          args.scales.YGROUP = () => getPlotTop(args)
          args.scaleFunctions.yGroupFunction = () => getPlotTop(args)
        }
        args.scaleFunctions.youtf = d => args.scaleFunctions.yf(d) + args.scaleFunctions.yGroupFunction(d)
      } else {
        const baselines = (args.baselines || []).map(d => d[args.yAccessor])
        yMaker = MGScale(args)
          .namespace('y')
          .inflateDomain(true)
          .zeroBottom(args.xAxis_type === 'categorical')
          .numericalDomainFromData(baselines)
          .numericalRange('left')

        args.scaleFunctions.youtf = d => args.scaleFunctions.yf(d)
      }

      /// //// COLOR accessor
      if (args.colorAccessor !== null) {
        const colorScale = MGScale(args).namespace('color')
        if (args.colorType === 'number') {
          // do the color scale.
          // etiher get color range, or what.
          colorScale
            .numericalDomainFromData(getColorDomain(args))
            .numericalRange(getColorRange(args))
            .clamp(true)
        } else {
          if (args.colorDomain) {
            colorScale
              .categoricalDomain(args.colorDomain)
              .categoricalRange(args.colorRange)
          } else {
            colorScale
              .categoricalDomainFromData()
              .categoricalColorRange()
          }
        }
      }

      if (args.sizeAccessor) {
        new MGScale(args).namespace('size')
          .numericalDomainFromData()
          .numericalRange(getSizeRange(args))
          .clamp(true)
      }

      new MG.axis_factory(args)
        .namespace('x')
        .type(args.xAxis_type)
        .zeroLine(args.yAxis_type === 'categorical')
        .position(args.xAxis_position)
        .rug(xRug(args))
        .label(addXLabel)
        .draw()

      new MG.axis_factory(args)
        .namespace('y')
        .type(args.yAxis_type)
        .zeroLine(args.xAxis_type === 'categorical')
        .position(args.yAxis_position)
        .rug(yRug(args))
        .label(addYLabel)
        .draw()

      this.mainPlot()
      this.markers()
      this.rollover()
      this.windowListeners()
      if (args.brush) MG.addBrushFunction(args)
      return this
    }

    this.markers = function () {
      markers(args)
      if (args.leastSquares) {
        addLs(args)
      }

      return this
    }

    this.mainPlot = function () {
      const svg = getSvgChildOf(args.target)

      const data = mg_filter_out_plot_bounds(args.data[0], args)
      // remove the old points, add new one
      svg.selectAll('.mg-points').remove()

      const g = svg.append('g')
        .classed('mg-points', true)

      const pts = g.selectAll('circle')
        .data(data)
        .enter().append('circle')
        .attr('class', (d, i) => `path-${i}`)
        .attr('cx', args.scaleFunctions.xoutf)
        .attr('cy', d => args.scaleFunctions.youtf(d))

      let highlights
      svg.selectAll('.mg-highlight').remove()
      if (args.highlight && mg_is_function(args.highlight)) {
        highlights = svg.append('g')
          .classed('mg-highlight', true)
          .selectAll('circle')
          .data(data.filter(args.highlight))
          .enter().append('circle')
          .attr('cx', args.scaleFunctions.xoutf)
          .attr('cy', d => args.scaleFunctions.youtf(d))
      }

      const elements = [pts].concat(highlights ? [highlights] : [])
      // are we coloring our points, or just using the default color?
      if (args.colorAccessor !== null) {
        elements.forEach(e => e.attr('fill', args.scaleFunctions.colorFunction).attr('stroke', args.scaleFunctions.colorFunction))
      } else {
        elements.forEach(e => e.classed('mg-points-mono', true))
      }

      pts.attr('r', (args.sizeAccessor !== null) ? args.scaleFunctions.sizef : args.pointSize)
      if (highlights) {
        highlights.attr('r', (args.sizeAccessor !== null) ? (d, i) => args.scaleFunctions.sizef(d, i) + 2 : args.pointSize + 2)
      }

      return this
    }

    this.rollover = function () {
      const svg = getSvgChildOf(args.target)

      if (svg.selectAll('.mg-active-datapoint-container').nodes().length === 0) {
        addG(svg, 'mg-active-datapoint-container')
      }

      // remove the old rollovers if they already exist
      svg.selectAll('.mg-voronoi').remove()

      // add rollover paths
      const voronoi = d3.voronoi()
        .x(args.scaleFunctions.xoutf)
        .y(args.scaleFunctions.youtf)
        .extent([
          [args.buffer, args.buffer + (args.title ? args.title_yPosition : 0)],
          [args.width - args.buffer, args.height - args.buffer]
        ])

      const paths = svg.append('g')
        .attr('class', 'mg-voronoi')

      paths.selectAll('path')
        .data(voronoi.polygons(mg_filter_out_plot_bounds(args.data[0], args)))
        .enter().append('path')
        .attr('d', d => d == null ? null : `M${d.join(',')}Z`)
        .attr('class', (d, i) => `path-${i}`)
        .style('fill-opacity', 0)
        .on('click', this.rolloverClick(args))
        .on('mouseover', this.rolloverOn(args))
        .on('mouseout', this.rolloverOff(args))
        .on('mousemove', this.rolloverMove(args))

      if (args.data[0].length === 1) {
        point_mouseover(args, svg, args.data[0][0])
      }

      return this
    }

    this.rolloverClick = args => {
      return (d, i) => {
        if (args.click) {
          args.click(d, i)
        }
      }
    }

    this.rolloverOn = args => {
      const svg = getSvgChildOf(args.target)

      return (d, i) => {
        svg.selectAll('.mg-points circle')
          .classed('selected', false)

        // highlight active point
        const pts = svg.selectAll(`.mg-points circle.path-${i}`)
          .classed('selected', true)

        if (args.sizeAccessor) {
          pts.attr('r', di => args.scaleFunctions.sizef(di) + args.active_pointSize_increase)
        } else {
          pts.attr('r', args.pointSize + args.active_pointSize_increase)
        }

        // trigger mouseover on all points for this class name in .linked charts
        if (args.linked && !MG.globals.link) {
          MG.globals.link = true

          // trigger mouseover on matching point in .linked charts
          d3.selectAll(`.mg-voronoi .path-${i}`)
            .each(() => {
              d3.select(this).on('mouseover')(d, i)
            })
        }

        if (args.show_rollover_text) {
          point_mouseover(args, svg, d.data)
        }

        if (args.mouseover) {
          args.mouseover(d, i)
        }
      }
    }

    this.rolloverOff = args => {
      const svg = getSvgChildOf(args.target)

      return (d, i) => {
        if (args.linked && MG.globals.link) {
          MG.globals.link = false

          d3.selectAll(`.mg-voronoi .path-${i}`)
            .each(() => {
              d3.select(this).on('mouseout')(d, i)
            })
        }

        // reset active point
        const pts = svg.selectAll('.mg-points circle')
          .classed('unselected', false)
          .classed('selected', false)

        if (args.sizeAccessor) {
          pts.attr('r', args.scaleFunctions.sizef)
        } else {
          pts.attr('r', args.pointSize)
        }

        // reset active data point text
        if (args.data[0].length > 1) clearMouseoverContainer(svg)

        if (args.mouseout) {
          args.mouseout(d, i)
        }
      }
    }

    this.rolloverMove = args => (d, i) => {
      if (args.mousemove) {
        args.mousemove(d, i)
      }
    }

    this.update = function (args) {
      return this
    }

    this.windowListeners = function () {
      windowListeners(this.args)
      return this
    }

    this.init(args)
  }

  const options = {
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

  MG.register('point', pointChart, options)
}
