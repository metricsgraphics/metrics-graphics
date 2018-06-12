// Gulp and plugins
var
  gulp = require('gulp'),
  umd    = require('gulp-umd'),
  rimraf = require('gulp-rimraf'),
  uglify = require('gulp-uglify'),
  concat = require('gulp-concat'),
  rename = require('gulp-rename'),
  //sass = require('gulp-sass'), // for building css from scss
  //minifycss = require('gulp-minify-css'), // for minifiing css
  jshint = require('gulp-jshint'),
  testem = require('gulp-testem'),
  connect = require('gulp-connect'),
  babel = require('gulp-babel');

// paths
var
  src = './src/js/',
  dist = './dist/',
  jsFiles = [
    'MG.js',
    'charts/bar.js',
    'charts/histogram.js',
    'charts/line.js',
    'charts/missing.js',
    'charts/point.js',
    'charts/table.js',
    'common/bootstrap_tooltip_popover.js',
    'common/brush.js',
    'common/chart_title.js',
    'common/data_graphic.js',
    'common/hooks.js',
    'common/init.js',
    'common/markers.js',
    'common/register.js',
    'common/rollover.js',
    'common/scales.js',
    'common/scales.js',
    'common/window_listeners.js',
    'common/x_axis.js',
    'common/y_axis.js',
    'common/zoom.js',
    'layout/bootstrap_dropdown.js',
    'layout/button.js',
    'misc/error.js',
    'misc/formatters.js',
    'misc/markup.js',
    'misc/process.js',
    'misc/smoothers.js',
    'misc/transitions.js',
    'misc/utility.js'
  ];


gulp.task('default', ['jshint', 'test', 'build:js']);

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
  return gulp.src(jsFiles.map(path => src + path))
    .pipe(concat({path: 'metricsgraphics.js'}))
    .pipe(babel({
      presets: ['env']
    }))
    .pipe(umd(
        {
          dependencies:function() {
            return [{
              name: 'd3',
              amd: 'd3',
              cjs: 'd3',
              global: 'd3',
              param: 'd3'
            }];
          },
          exports: function() {
            return "MG";
          },
          namespace: function() {
            return "MG";
          }
        }
    ))
    .pipe(gulp.dest(dist))
    .pipe(rename('metricsgraphics.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest(dist));
});

// Check source js files with jshint
gulp.task('jshint', function () {
  return gulp.src(jsFiles)
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

// Run test suite server (testem')
gulp.task('test', function() {
  return gulp.src([''])
    .pipe(testem({
      configFile: 'testem.json'
    }));
});


// Development server tasks
// NOTE: these paths will need changing when the SCSS source is ready
var roots = ['dist', 'examples', 'src', 'bower_components'],
    watchables = roots.map(function(root) {
        return root + '/**/*';
    });

gulp.task('dev:watch', function() { return gulp.watch(watchables, ['jshint', 'dev:reload']); });
gulp.task('dev:reload', function() { return gulp.src(watchables).pipe(connect.reload()); });
gulp.task('serve', ['jshint', 'dev:serve', 'dev:watch']);

gulp.task('dev:serve', function() {
    connect.server({
        root: roots,
        port: 4300,
        livereload: true
    });
});
