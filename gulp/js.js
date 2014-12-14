'use strict';

var gulp         = require('gulp'),
    $            = require('gulp-load-plugins')();

var paths        = require('./utils/paths'),
    handleErrors = require('./utils/handleErrors');

// until the files are made into modules, we will control the order:

var files = [
  'common/data_graphic.js',
  'common/bootstrap_tooltip_popover.js',
  'common/chart_title.js',
  'common/y_axis.js',
  'common/x_axis.js',
  'common/init.js',
  'common/markers.js',
  'layout/bootstrap_dropdown.js',
  'layout/button.js',
  'charts/line.js',
  'charts/histogram.js',
  'charts/point.js',
  'charts/bar.js',
  'charts/table.js',
  'charts/missing.js',
  'misc/process.js',
  'misc/smoothers.js',
  'misc/utility.js',
  'misc/error.js'
];

// append path
files = files.map(function(file) {
  return paths.src.js + file;
});

// compile js and move to dist folder and examples/lib folder
gulp.task('js:build', function() {
  return gulp.src(files)
    .pipe($.sourcemaps.init())
    .pipe($.concat('metricsgraphics.js'))
    .on('error', handleErrors)
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest(paths.dist))
    .pipe(gulp.dest(paths.example.js))
    .pipe($.rename('metricsgraphics.min.js'))
    .pipe($.uglify())
    .pipe(gulp.dest(paths.dist))
    .pipe(gulp.dest(paths.example.js));
});


// define task
gulp.task('js', ['js:build']);
