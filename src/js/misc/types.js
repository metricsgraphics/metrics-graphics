export function is_numeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

export function compare_type(type, value) {
  if (value == null) return true; // allow null or undefined
  if (typeof type === 'string') {
    if (type.substr(-2) === '[]') {
      if (!Array.isArray(value)) return false;
      return value.every(i => compare_type(type.slice(0, -2), i));
    }
    return typeof value === type
      || value === type
      || type.length === 0
      || type === 'array' && Array.isArray(value);
  }
  if (typeof type === 'function') return value === type || value instanceof type;
  return Array.isArray(type) && !!~type.findIndex(i => compare_type(i, value));
}

export function is_date(obj) {
  return Object.prototype.toString.call(obj) === '[object Date]';
}

export function is_function(obj) {
  return Object.prototype.toString.call(obj) === '[object Function]';
}

export function is_empty_array(thing) {
  return Array.isArray(thing) && thing.length === 0;
}

export function is_object(thing) {
  return Object.prototype.toString.call(thing) === '[object Object]';
}

export function is_array_of_arrays(data) {
  var all_elements = data.map(function(d) {
    return Array.isArray(d) === true && d.length > 0;
  });

  return d3.sum(all_elements) === data.length;
}

export function is_array_of_objects(data) {
  // is every element of data an object?
  var all_elements = data.map(function(d) {
    return is_object(d) === true;
  });

  return d3.sum(all_elements) === data.length;
}

export function is_array_of_objects_or_empty(data) {
  return is_empty_array(data) || is_array_of_objects(data);
}
