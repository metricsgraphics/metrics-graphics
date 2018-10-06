import { compare_type } from '../misc/types.js';

export function validate_option(options, key, value) {
  if (!Array.isArray(options[key])) return false; // non-existent option
  const typeDef = options[key][1];
  if (!typeDef) return true; // not restricted type
  return compare_type(typeDef, value);
}

export function options_to_defaults(obj) {
  return Object.keys(obj).reduce((r, k) => {
    r[k] = obj[k][0];
    return r;
  }, {});
}

export function merge_with_defaults(obj) {
  // code outline taken from underscore
  Array.prototype.slice.call(arguments, 1).forEach(source => {
    if (source) {
      for (var prop in source) {
        if (obj[prop] === void 0) obj[prop] = source[prop];
      }
    }
  });

  return obj;
}
