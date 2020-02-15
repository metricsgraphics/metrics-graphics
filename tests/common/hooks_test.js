module('hooks', {
  setup: function () {
    delete MG._hooks.test
  }
})

test('multiple hooks with the same name execute in order', function () {
  var result = ''

  function hookOne () {
    result = result + 'one'
  }

  function hookTwo () {
    result = result + 'two'
  }

  MG.addHook('test', hookOne)
  MG.addHook('test', hookTwo)

  MG.callHook('test')

  equal(result, 'onetwo', 'both hooks are called')
})

test('hooks can have context', function () {
  var result = {}

  function contextedHook () {
    this.foo = 'bar'
  }

  MG.addHook('test', contextedHook, result)

  MG.callHook('test')

  equal(result.foo, 'bar', 'exectued in the correct context')
})

test('hooks accept single arguments', function () {
  var result

  function singleArgHook (arg) {
    result = arg
    equal(typeof arg, 'string', 'correctly passed as a string')
  }

  MG.addHook('test', singleArgHook, null)

  MG.callHook('test', 'one')

  equal(result, 'one', 'single argument is received')
})

test('hooks accept multiple arguments', function () {
  var result

  function multipleArgHook (arg1, arg2, arg3) {
    result = [arg1, arg2, arg3].join(' ')

    ok([arg1, arg2, arg3].every(function (arg) {
      return typeof arg === 'string'
    }), 'correctly passed as strings')
  }

  MG.addHook('test', multipleArgHook)

  MG.callHook('test', 'one', 'two', 'three')

  equal(result, 'one two three', 'multiple arguments are passed correctly')
})

test('hooks are chained - result from one passed into the next', function () {
  var initial = 2
  var result

  function hookOne (arg) {
    return arg * 2
  }

  function hookTwo (arg) {
    return arg - 1
  }

  MG.addHook('test', hookOne)
  MG.addHook('test', hookTwo)

  result = MG.callHook('test', initial)

  equal(result, 3, 'result has been chained')
})

test('hooks should return multiple inputs as an array', function () {
  var result

  function hookOne (arg1, arg2, arg3) {
    return [arg1, arg2, arg3]
  }

  function hookTwo (arg1, arg2, arg3) {
    return [arg3, arg2, arg1]
  }

  MG.addHook('test', hookOne)
  MG.addHook('test', hookTwo)

  result = MG.callHook('test', [1, 2, 3])

  equal(result.join('-'), '3-2-1', 'array is passed in the result')
})

test('if the result from a chained hook is undefined', function () {
  var initial = 2

  function hookOne (arg) {
    // don't return anything
  }

  function hookTwo (arg) {
    equal(arg, initial, 'initial value is used')
  }

  MG.addHook('test', hookOne)
  MG.addHook('test', hookTwo)
  result = MG.callHook('test', initial)

  delete MG._hooks.test

  function hookThree (arg) {
    return arg - 1
  }

  function hookFour (arg) {
    // don't return anything
  }

  function hookFive (arg) {
    equal(initial, arg - 1, 'processed value is passed if it is already set')
  }

  MG.addHook('test', hookOne)
  MG.addHook('test', hookTwo)
  result = MG.callHook('test', initial)
})

test('a hook can only have one registered instance of any function', function () {
  function hookOne () {}

  MG.addHook('test', hookOne)

  try {
    MG.addHook('test', hookOne)
  } catch (error) {
    equal(error, 'That function is already registered.', 'an exception is raised')
  }
})
