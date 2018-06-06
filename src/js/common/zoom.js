{

const filter_in_range_data = (args, range) => {
  const is_data_in_range = (data, range) => {
    return data > Math.min(range[0], range[1]) && data < Math.max(range[0], range[1]);
  };
  // if range without this axis return true, else judge is data in range or not.
  return d => ['x', 'y'].every(dim => !(dim in range) || is_data_in_range(d[args[`${dim}_accessor`]], range[dim]));
};

// the range here is the range of data
// range is an object with two optional attributes of x,y, respectively represent ranges on two axes
const zoom_to_data_domain = (args, range) => {
  const raw_data = args.processed.raw_data || args.data;
  // store raw data and raw domain to in order to zoom back to the initial state
  if (!('raw_data' in args.processed)) {
    args.processed.raw_domain = {
      x: args.scales.X.domain(),
      y: args.scales.Y.domain()
    };
    args.processed.raw_data = raw_data;
  }
  // to avoid drawing outside the chart in the point chart, unnecessary in line chart.
  if (args.chart_type === 'point') {
    if (is_array_of_arrays(raw_data)) {
      args.data = raw_data.map(function(d) {
        return d.filter(filter_in_range_data(args, range));
      });
    } else {
      args.data = raw_data.filter(filter_in_range_data(args, range));
    }
  }
  ['x', 'y'].forEach(dim => {
    if (dim in range) args.processed[`zoom_${dim}`] = range[dim];
    else delete args.processed[`zoom_${dim}`];
  });
  if (args.processed.subplot) {
    if (range !== args.processed.raw_domain) {
      MG.create_brushing_pattern(args.processed.subplot, convert_domain_to_range(args.processed.subplot, range));
    } else {
      MG.remove_brushing_pattern(args.processed.subplot);
    }
  }
  new MG.charts[args.chart_type || defaults.chart_type].descriptor(args);
};

const zoom_to_raw_range = args => {
  if (!('raw_domain' in args.processed)) return;
  zoom_to_data_domain(args, args.processed.raw_domain);
  delete args.processed.raw_domain;
  delete args.processed.raw_data;
};

// converts the range of selection into the range of data that we can use to
// zoom the chart to a particular region
const convert_range_to_domain = (args, range) =>
  ['x', 'y'].reduce((domain, dim) => {
    if (!(dim in range)) return domain;
    domain[dim] = range[dim].map(v => +args.scales[dim.toUpperCase()].invert(v));
    if (dim === 'y') domain[dim].reverse();
    return domain;
  }, {});

const convert_domain_to_range = (args, domain) =>
  ['x', 'y'].reduce((range, dim) => {
    if (!(dim in domain)) return range;
    range[dim] = domain[dim].map(v => +args.scales[dim.toUpperCase()](v));
    if (dim === 'y') range[dim].reverse();
    return range;
  }, {});

// the range here is the range of selection
const zoom_to_data_range = (args, range) => {
  const domain = convert_range_to_domain(args, range);
  zoom_to_data_domain(args, domain);
};

MG.convert_range_to_domain = convert_range_to_domain;
MG.zoom_to_data_domain = zoom_to_data_domain;
MG.zoom_to_data_range = zoom_to_data_range;
MG.zoom_to_raw_range = zoom_to_raw_range;

}
