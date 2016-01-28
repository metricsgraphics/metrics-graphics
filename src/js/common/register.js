function register(chartType, descriptor, defaults) {
  MG.charts[chartType] = {
    descriptor: descriptor,
    defaults: defaults || {}
  };
}

MG.register = register;
