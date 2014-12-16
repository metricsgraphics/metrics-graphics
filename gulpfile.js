'use strict';

require('./gulp/js');
require('./gulp/css');

// task runner
require('./gulp/tasks');

/**

  Current tasks:
  - gulp (process js/css)
  - gulp watch (default, watch js/css folders)
  - gulp serve (watch, run development server with livereload)
  - gulp test (run testem suite)

**/
