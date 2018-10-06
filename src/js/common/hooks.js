/**
  Record of all registered hooks.
  For internal use only.
*/
let _hooks = {};

/**
  Add a hook callthrough to the stack.

  Hooks are executed in the order that they were registered.
*/
export function add_hook(name, func, context) {
  var hooks;

  if (!_hooks[name]) {
    hooks[name] = [];
  }

  hooks = _hooks[name];

  var already_registered =
    hooks.filter(function(hook) {
      return hook.func === func;
    })
    .length > 0;

  if (already_registered) {
    throw 'That function is already registered.';
  }

  hooks.push({
    func: func,
    context: context
  });
}

/**
  Execute registered hooks.

  Optional arguments
*/
export function call_hook(name) {
  var hooks = _hooks[name],
    result = [].slice.apply(arguments, [1]),
    processed;

  if (hooks) {
    hooks.forEach(function(hook) {
      if (hook.func) {
        var params = processed || result;

        if (params && params.constructor !== Array) {
          params = [params];
        }

        params = [].concat.apply([], params);
        processed = hook.func.apply(hook.context, params);
      }
    });
  }

  return processed || result;
}
