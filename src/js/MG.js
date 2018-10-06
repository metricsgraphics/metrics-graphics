import { arr_diff, clone, convert, time_format, truncate_text, wrap_text } from './misc/utility.js';
import { markers } from './common/markers.js';
import { convert_range_to_domain, zoom_to_data_domain, zoom_to_data_range, zoom_to_raw_range} from './common/zoom.js';
import { data_graphic } from './common/data_graphic.js';

const lib = {
  arr_diff,
  convert_range_to_domain,
  convert,
  data_graphic,
  markers,
  time_format,
  truncate_text,
  wrap_text,
  zoom_to_data_domain,
  zoom_to_data_range,
  zoom_to_raw_range,
};

export default lib;
