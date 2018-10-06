import { options_to_defaults } from '../misc/options.js';
import { barChart, barchartOptions } from '../charts/bar.js';
import { lineChart } from '../charts/line.js';
import { pointChart, pointChartOptions } from '../charts/point.js';

export const CHARTS = {};
export const OPTIONS = {};

function register(chartType, descriptor, options) {
  const defaults = options ? options_to_defaults(options) : {};
  CHARTS[chartType] = {
    descriptor: descriptor,
    defaults: defaults,
  };
  if (options) {
    Object.keys(options).map(key => {
      if (!(key in options)) {
        OPTIONS[key] = options[key];
      }
    });
  }
}

register('bar', barChart, barchartOptions);
register('line', lineChart);
register('point', pointChart, pointChartOptions);
