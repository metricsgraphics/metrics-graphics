module('missing')

test('Missing chart\'s text matches specified missingText', function () {
  var params = {
    target: '#qunit-fixture',
    chartType: 'missing-data',
    missingText: 'In an astral plane that was never meant to fly...'
  }

  MG.dataGraphic(params)
  equal(document.querySelector('.mg-missing-text').textContent,
    params.missingText,
    'Missing chart\'s text matches missingText')
})

test('Only one mg-missing-pane on multiple calls to the same target element', function () {
  var params = {
    target: '#qunit-fixture',
    chartType: 'missing-data',
    missingText: 'In an astral plane that was never meant to fly...'
  }

  MG.dataGraphic(params)
  MG.dataGraphic(MG.clone(params))

  equal(document.querySelectorAll(params.target + ' .mg-missing-pane').length, 1, 'We only have one mg-missing-pane')
})

test('Only one mg-missing-text on multiple calls to the same target element', function () {
  var params = {
    target: '#qunit-fixture',
    chartType: 'missing-data',
    missingText: 'In an astral plane that was never meant to fly...'
  }

  MG.dataGraphic(params)
  MG.dataGraphic(MG.clone(params))

  equal(document.querySelectorAll(params.target + ' .mg-missing-text').length, 1, 'We only have one mg-missing-text')
})

test('missing chart obeys fullWidth: true', function () {
  var params = {
    target: '#qunit-fixture',
    chartType: 'missing-data',
    fullWidth: true,
    missingText: 'In an astral plane that was never meant to fly...'
  }
  document.querySelector('#qunit-fixture').style.width = '700px'

  MG.dataGraphic(params)

  equal(document.querySelector('#qunit-fixture svg').getAttribute('width'), 700, 'The missing chart svg has same width as parent element.')
})

test('missing chart obeys full_height: true', function () {
  var params = {
    target: '#qunit-fixture',
    chartType: 'missing-data',
    full_height: true,
    missingText: 'In an astral plane that was never meant to fly...'
  }
  document.querySelector('#qunit-fixture').style.height = '700px'

  MG.dataGraphic(params)

  equal(document.querySelector('#qunit-fixture svg').getAttribute('height'), 700, 'The missing chart svg has same width as parent element.')
})

test('Missing chart\'s width is set correctly on subsequent calls to existing chart', function () {
  var params_0 = {
    target: '#qunit-fixture',
    chartType: 'missing-data',
    missingText: 'In an astral plane that was never meant to fly...'
  }

  var params = {
    target: '#qunit-fixture',
    chartType: 'missing-data',
    missingText: 'In an astral plane that was never meant to fly...',
    width: 200,
    height: 100
  }

  MG.dataGraphic(params_0)
  MG.dataGraphic(params)

  var width = document.querySelector(params.target + ' svg').clientWidth
  ok(width == 200, 'SVG\'s width matches latest specified width')
})
