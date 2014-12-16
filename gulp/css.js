'use strict';

var gulp         = require('gulp'),
    $            = require('gulp-load-plugins')(),
    browserSync  = require('browser-sync');

var paths        = require('./utils/paths'),
    handleErrors = require('./utils/handleErrors');

// SCSS Gulp Tasks will go here, but for now we'll use css:

gulp.task('css', function() {
  gulp.src([paths.src.css + '**/*'])
    .pipe(gulp.dest(paths.dist))
    .pipe(gulp.dest(paths.example.css))
    .pipe($.csso())
    .on('error', handleErrors)
    .pipe($.rename('metricsgraphics.min.css'))
    .pipe(gulp.dest(paths.dist))
    .pipe(gulp.dest(paths.example.css))
    .pipe(browserSync.reload({ stream:true }));
});
