// Gulp and plugins
var
  gulp = require('gulp'),
  rimraf = require('gulp-rimraf'),
  uglify = require('gulp-uglify'),
  concat = require('gulp-concat'),
  rename = require('gulp-rename'),
//sass = require('gulp-sass'), // for building css from scss
//minifycss = require('gulp-minify-css'), // for minifiing css
  jslint = require('gulp-jslint'),
  testem = require('gulp-testem'),
  es6ModuleTranspiler = require("gulp-es6-module-transpiler");

// paths
var
  src = './src/js/',
//scss = './scss/',
//scssFiles = [],
//scssDependencies = [],
  dist = './dist/',
  jsFiles = [
    src + 'MG.js',
    src + 'common/data_graphic.js',
    src + 'common/bootstrap_tooltip_popover.js',
    src + 'common/chart_title.js',
    src + 'common/y_axis.js',
    src + 'common/x_axis.js',
    src + 'common/init.js',
    src + 'common/markers.js',
    src + 'layout/bootstrap_dropdown.js',
    src + 'layout/button.js',
    src + 'charts/line.js',
    src + 'charts/histogram.js',
    src + 'charts/point.js',
    src + 'charts/bar.js',
    src + 'charts/table.js',
    src + 'charts/missing.js',
    src + 'misc/process.js',
    src + 'misc/smoothers.js',
    src + 'misc/utility.js',
    src + 'misc/error.js',
    src + 'end.js'
  ];

gulp.task('clean', function () {
  return gulp.src([dist + 'metricsgraphics.js', dist + 'metricsgraphics.min.js'], {read: false})
    .pipe(rimraf());
});

// build css files from scss
//gulp.task('build:css', ['clean'], function () {
//  return gulp.src(scssFiles)
//    .pipe(sass({includePaths: scssDependencies}))
//    .pipe(minifycss())
//    .pipe(gulp.dest(dist));
//});

// create 'metricsgraphics.js' and 'metricsgraphics.min.js' from source js
gulp.task('build:js', ['clean'], function () {
  return gulp.src(jsFiles)
    .pipe(concat('metricsgraphics.js'))
     .pipe(es6ModuleTranspiler({
        type: "plain"
    }))
    .pipe(gulp.dest(dist))
    .pipe(rename('metricsgraphics.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest(dist));
});

// check source js files with jslint
gulp.task('jslint', function () {
  return gulp.src(jsFiles)
    .pipe(jslint({
      predef: ["window", '$', 'd3'], // used globals
      nomen: false // true if there are variable names with leading _
    }));
});

gulp.task('test', function() {
  return gulp.src([''])
    .pipe(testem({
      configFile: 'testem.json'
    }));
});
