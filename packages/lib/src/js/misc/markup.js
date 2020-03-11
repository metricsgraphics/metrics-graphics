// influenced by https://bl.ocks.org/tomgp/c99a699587b5c5465228

import { select } from 'd3'

let virtualWindow

export function renderMarkupForServer (callback) {
  const virtualD3 = select(virtualWindow.document)
  const target = virtualWindow.document.createElement('div')

  const originalD3 = global.d3
  const originalWindow = global.window
  const originalDocument = global.document
  global.d3 = virtualD3
  global.window = virtualWindow
  global.document = virtualWindow.document

  let error
  try {
    callback(target)
  } catch (e) {
    error = e
  }

  global.d3 = originalD3
  global.window = originalWindow
  global.document = originalDocument

  if (error) throw error

  /* for some reason d3.select parses jsdom elements incorrectly
   * but it works if we wrap the element in a function.
   */
  return virtualD3.select(function targetFn () {
    return target
  }).html()
}

export function renderMarkupForClient (callback) {
  const target = document.createElement('div')
  callback(target)
  return select(target).html()
}

export function renderMarkup (callback) {
  switch (typeof window) {
    case 'undefined':
      return renderMarkupForServer(callback)
    default:
      return renderMarkupForClient(callback)
  }
}

export function initVirtualWindow (jsdom, force) {
  if (virtualWindow && !force) return

  const doc = jsdom.jsdom({
    html: '',
    features: { QuerySelector: true }
  })
  virtualWindow = doc.defaultView
}
