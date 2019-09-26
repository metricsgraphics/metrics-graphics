import { merge_with_defaults, validate_option, options_to_defaults } from '../misc/options.js';
import { call_hook } from './hooks.js';
import { CHARTS, OPTIONS } from './charts.js';

export const globals = {
  link: false,
  version: "1.1"
};

export let deprecations = {
  rollover_callback: { replacement: 'mouseover', version: '2.0' },
  rollout_callback: { replacement: 'mouseout', version: '2.0' },
  x_rollover_format: { replacement: 'x_mouseover', version: '2.10' },
  y_rollover_format: { replacement: 'y_mouseover', version: '2.10' },
  show_years: { replacement: 'show_secondary_x_label', version: '2.1' },
  xax_start_at_min: { replacement: 'axes_not_compact', version: '2.7' },
  interpolate_tension: { replacement: 'interpolate', version: '2.10' }
};

let charts = {};

const defaults = options_to_defaults(OPTIONS);

export function data_graphic(options = {}) {
  call_hook('global.defaults', defaults);
  for (let key in options) {
    if (!validate_option(OPTIONS, key, options[key])) {
      if (!(key in OPTIONS)) {
        console.warn(`Option ${key} not recognized`);
      } else {
        console.warn(`Option ${key} expected type ${OPTIONS[key][1]} but got ${options[key]} instead`);
      }
    }
  }
  let selected_chart = CHARTS[options.chart_type || defaults.chart_type];
  let args = merge_with_defaults(options, selected_chart.defaults, defaults);

  if (args.list) {
    args.x_accessor = 0;
    args.y_accessor = 1;
  }

  // check for deprecated parameters
  for (var key in deprecations) {
    if (args.hasOwnProperty(key)) {
      var deprecation = deprecations[key],
        message = 'Use of `args.' + key + '` has been deprecated',
        replacement = deprecation.replacement,
        version;

      // transparently alias the deprecated
      if (replacement) {
        if (args[replacement]) {
          message += '. The replacement - `args.' + replacement + '` - has already been defined. This definition will be discarded.';
        } else {
          args[replacement] = args[key];
        }
      }

      if (deprecation.warned) {
        continue;
      }

      deprecation.warned = true;

      if (replacement) {
        message += ' in favor of `args.' + replacement + '`';
      }

      warn_deprecation(message, deprecation.version);
    }
  }

  call_hook('global.before_init', args);

  new selected_chart.descriptor(args);
  console.log(args);
  return args;
}
