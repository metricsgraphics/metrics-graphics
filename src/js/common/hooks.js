/**
  Record of all registered hooks.
  For internal use only.
*/
MG._hooks = {};

/**
  Add a hook callthrough to the stack.

  Hooks are executed in the order that they were registered.
*/
MG.add_hook = function(name, func, context) {
  var hooks;

  if (!MG._hooks[name]) {
    MG._hooks[name] = [];
  }

  hooks = MG._hooks[name];

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
};

/**
  Execute registered hooks.

  Optional arguments
*/
MG.call_hook = function(name) {
  var hooks = MG._hooks[name],
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
};
