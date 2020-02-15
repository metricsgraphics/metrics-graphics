import { timeFormat as d3TimeFormat, timeParse, utcFormat } from 'd3-time-format'
import { select } from 'd3-selection'

let nextElementId = 0

const RUG_OPACITY = 0.3

export const convert = {

  date: (data, accessor, timeFormat = '%Y-%m-%d') => {
    const parseTime = timeParse(timeFormat)
    return data.map(d => {
      d[accessor] = parseTime(d[accessor].trim())
      return d
    })
  },

  number: (data, accessor) => data.map(d => {
    d[accessor] = Number(d[accessor])
    return d
  })
}

export function timeFormat (utc, specifier) {
  return utc ? utcFormat(specifier) : d3TimeFormat(specifier)
}

export function getRolloverTimeFormat (args) {
  // if a rollover time format is defined, use that
  if (args.rollover_time_format) {
    return timeFormat(args.utcTime, args.rollover_time_format)
  }

  switch (args.processed.xTimeFrame) {
    case 'millis':
      return timeFormat(args.utcTime, '%b %e, %Y  %H:%M:%S.%L')
    case 'seconds':
      return timeFormat(args.utcTime, '%b %e, %Y  %H:%M:%S')
    case 'less-than-a-day':
      return timeFormat(args.utcTime, '%b %e, %Y  %I:%M%p')
    case 'four-days':
      return timeFormat(args.utcTime, '%b %e, %Y  %I:%M%p')
    default:
      return timeFormat(args.utcTime, '%b %e, %Y')
  }
}

export function dataInPlotBounds (datum, args) {
  return datum[args.xAccessor] >= args.processed.minX &&
  datum[args.xAccessor] <= args.processed.maxX &&
  datum[args.yAccessor] >= args.processed.minY &&
  datum[args.yAccessor] <= args.processed.maxY
}

export function getBottom (args) { return args.height - args.bottom }
export function getRight (args) { return args.width - args.right }

// returns the pixel location of the respective side of the plot area.
export function getPlotBottom (args) { return getBottom(args) - args.buffer }
export function getPlotTop (args) { return args.top + args.buffer }
export function getPlotLeft (args) { return args.left + args.buffer }
export function getPlotRight (args) { return getRight(args) - args.buffer }

/**
 * adding and removing elements
 */
export function exitAndRemove (el) { return el.exit().remove() }
export function selectAllAndRemove (svg, cl) { return svg.selectAll(cl).remove() }
export function addG (svg, cl) { return svg.append('g').classed(cl, true) }
export function getSvgChildOf (selectorOrNode) { select(selectorOrNode).select('svg') }

/**
 * axis helpers
 */
export function makeRug (args, rugClass) {
  const svg = getSvgChildOf(args.target)
  const allData = args.data.flat(Infinity)
  const rug = svg.selectAll(`line.${rugClass}`).data(allData)

  rug.enter()
    .append('line')
    .attr('class', rugClass)
    .attr('opacity', RUG_OPACITY)

  // remove rug elements that are no longer in use
  exitAndRemove(rug)

  return rug
}

export function addColorAccessorToRug (rug, args, rugMonoClass) {
  if (args.colorAccessor) {
    rug.attr('stroke', args.scaleFunctions.colorFunction).classed(rugMonoClass, false)
  } else {
    rug.attr('stroke', null).classed(rugMonoClass, true)
  }
}

export function rotateLabels (labels, degree) {
  if (!degree) return
  labels.attr({
    dy: 0,
    transform: function () {
      const elem = select(this)
      return `rotate(${degree} ${elem.attr('x')},${elem.attr('y')})`
    }
  })
}

/**
 * overlap functions
 */
export function elementsAreOverlapping (labels) {
  labels = labels.node()
  if (!labels) return false
  return labels.some(label => isHorizontallyOverlapping(label, labels))
}

export function isVerticallyOverlapping (element, sibling) {
  const elementBox = element.getBoundingClientRect()
  const siblingBox = sibling.getBoundingClientRect()

  if (elementBox.top <= siblingBox.bottom && elementBox.top >= siblingBox.top) {
    return siblingBox.bottom - elementBox.top
  }

  return false
}

export function isHorizontallyOverlapping (element, sibling) {
  const elementBox = element.getBoundingClientRect()
  const siblingBox = sibling.getBoundingClientRect()

  if (elementBox.right >= siblingBox.left || elementBox.top >= siblingBox.top) {
    return siblingBox.bottom - elementBox.top
  }

  return false
}

export function preventHorizontalOverlap (labels, args) {
  if (!labels || labels.length === 1) return

  // see if each of our labels overlaps any of the other labels
  labels.forEach(label => {
    // if so, nudge it up a bit, if the label it intersects hasn't already been nudged
    if (labels.some(sibling => isHorizontallyOverlapping(label, sibling))) {
      const node = select(label)
      let newY = +node.attr('y')
      if (newY + 8 >= args.top) newY = args.top - 16
      node.attr('y', newY)
    }
  })
}

export function preventVerticalOverlap (labels, args) {
  if (!labels || labels.length === 1) return

  labels.sort((b, a) => select(a).attr('y') - select(b).attr('y'))

  labels.reverse()

  let overlapAmount
  let firstLabel
  let secondLabel

  // see if each of our labels overlaps any of the other labels
  for (let i = 0; i < labels.length; i++) {
    // if so, nudge it up a bit, if the label it intersects hasn't already been nudged
    firstLabel = select(labels[i]).text()

    for (let j = 0; j < labels.length; j++) {
      secondLabel = select(labels[j]).text()
      overlapAmount = isVerticallyOverlapping(labels[i], labels[j])

      if (overlapAmount !== false && firstLabel !== secondLabel) {
        const node = select(labels[i])
        let newY = +node.attr('y')
        newY += overlapAmount
        node.attr('y', newY)
      }
    }
  }
}

/**
 * Misc
 */
export function isArrayOfArrays (arr) { return arr.every(el => Array.isArray(el)) }
export function isArrayOfObjects (arr) { return arr.every(el => typeof el === 'object' && el !== null) }
export function isArrayOfObjectsOrEmpty (arr) { return arr.every(el => typeof el === 'object') }
export function inferType (args, ns) {
  // must return categorical or numerical.
  let testPoint = args.data.flat()

  testPoint = testPoint[0][args[ns + '_accessor']]
  return typeof testPoint === 'string' ? 'categorical' : 'numerical'
}

export function normalize (string) {
  return string
    .replace(/[^a-zA-Z0-9 _-]+/g, '')
    .replace(/ +?/g, '')
}

export function nextId () { return `mg-${(nextElementId++)}` }

export function targetRef (target) {
  if (typeof target === 'string') {
    return normalize(target)
  } else if (target instanceof window.HTMLElement) {
    let reference = target.getAttribute('data-mg-uid')
    if (!reference) {
      reference = nextId()
      target.setAttribute('data-mg-uid', reference)
    }

    return reference
  } else {
    console.warn('The specified target should be a string or an HTMLElement.', target)
    return normalize(target)
  }
}

export function optionsToDefaults (obj) {
  return Object.keys(obj).reduce((r, k) => {
    r[k] = obj[k][0]
    return r
  }, {})
}

export function clone (obj) { return JSON.parse(JSON.stringify(obj)) }

export function arrayDiff (a1, a2) { return a1.filter(el => !a2.includes(el)) }

export function warnDeprecation (message, untilVersion) {
  console.warn('Deprecation: ' + message + (untilVersion ? '. This feature will be removed in ' + untilVersion + '.' : ' the near future.'))
  console.trace()
}

export function getPixelDimension (target, dimension) { return Number(select(target).style(dimension).replace(/px/g, '')) }
export function getWidth (target) { return getPixelDimension(target, 'width') }
export function getHeight (target) { return getPixelDimension(target, 'height') }

/**
 * Text functions
 */
export function truncateText (textObj, textString, width) {
  let box
  let position = 0

  textObj.textContent = textString
  box = textObj.getBBox()

  while (box.width > width) {
    textObj.textContent = textString.slice(0, --position) + '...'
    box = textObj.getBBox()

    if (textObj.textContent === '...') break
  }
}

export function wrapText (text, width, token, tspanAttrs) {
  text.each(() => {
    const text = select(this)
    const words = text.text().split(token || /\s+/).reverse()
    let word
    let line = []
    let lineNumber = 0
    const lineHeight = 1.1
    const dy = 0
    let tspan = text.text(null)
      .append('tspan')
      .attr('x', 0)
      .attr('y', dy + 'em')
      .attr(tspanAttrs || {})

    while (words.length) {
      word = words.pop()
      line.push(word)
      tspan.text(line.join(' '))
      if (width === null || tspan.node().getComputedTextLength() > width) {
        line.pop()
        tspan.text(line.join(' '))
        line = [word]
        tspan = text
          .append('tspan')
          .attr('x', 0)
          .attr('y', ++lineNumber * lineHeight + dy + 'em')
          .attr(tspanAttrs || {})
          .text(word)
      }
    }
  })
}
