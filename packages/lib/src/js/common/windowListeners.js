import { select } from 'd3'
import { getWidth } from '../misc/utility'

export function WindowResizeTracker () {
  const targets = []

  let Observer = MutationObserver // eslint-disable-line

  function windowListener () {
    targets.forEach(function (target) {
      const svg = select(target).select('svg')

      // skip if svg is not visible
      if (!svg.empty() && (svg.node().parentNode.offsetWidth > 0 || svg.node().parentNode.offsetHeight > 0)) {
        const aspect = svg.attr('width') !== 0 ? (svg.attr('height') / svg.attr('width')) : 0

        const newWidth = getWidth(target)

        svg.attr('width', newWidth)
        svg.attr('height', aspect * newWidth)
      }
    })
  }

  function removeTarget (target) {
    const index = targets.indexOf(target)
    if (index !== -1) {
      targets.splice(index, 1)
    }

    if (targets.length === 0) {
      window.removeEventListener('resize', windowListener, true)
    }
  }

  return {
    add_target: function (target) {
      if (targets.length === 0) {
        window.addEventListener('resize', windowListener, true)
      }

      if (targets.indexOf(target) === -1) {
        targets.push(target)

        if (Observer) {
          const observer = new Observer(function (mutations) {
            const targetNode = select(target).node()

            if (!targetNode || mutations.some(
              function (mutation) {
                for (let i = 0; i < mutation.removedNodes.length; i++) {
                  if (mutation.removedNodes[i] === targetNode) {
                    return true
                  }
                }
              })) {
              observer.disconnect()
              removeTarget(target)
            }
          })

          observer.observe(select(target).node().parentNode, { childList: true })
        }
      }
    }
  }
}

const windowResizeTracker = new WindowResizeTracker()

export function windowListeners (args) {
  ifAspectRatioResizeSvg(args)
}

export function ifAspectRatioResizeSvg (args) {
  // have we asked the svg to fill a div, if so resize with div
  if (args.fullWidth || args.full_height) {
    windowResizeTracker.add_target(args.target)
  }
}
