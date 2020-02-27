const hookMap = new Map()

/**
  Add a hook callthrough to the stack.
  Hooks are executed in the order that they were registered.
*/
export function addHook (name, func, context) {
  const hooks = hookMap.get(name) || []

  const alreadyRegistered = hooks.some(hook => hook.func === func)

  if (alreadyRegistered) throw new Error('That function is already registered.')

  hooks.push({
    func: func,
    context: context
  })
  hookMap.set(name, hooks)
};

/**
  Execute registered hooks.
  Optional arguments
*/
export function callHook (name) {
  const hooks = hookMap.get(name) || []
  const result = [].slice.apply(arguments, [1])
  let processed

  if (hooks) {
    hooks.forEach(function (hook) {
      if (hook.func) {
        let params = processed || result

        if (params && params.constructor !== Array) {
          params = [params]
        }

        params = [].concat.apply([], params)
        processed = hook.func.apply(hook.context, params)
      }
    })
  }

  return processed || result
};
