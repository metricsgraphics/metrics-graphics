function register(chartType, descriptor, options) {
  const defaults = options ? options_to_defaults(options) : {};
  MG.charts[chartType] = {
    descriptor: descriptor,
    defaults: defaults,
  };
  if (options) {
    Object.keys(options).map(key => {
      if (!(key in MG.options)) {
        MG.options[key] = options[key];
      }
    });
  }
}

MG.register = register;
