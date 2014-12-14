'use strict';

var gulp         = require('gulp'),
    browserSync  = require('browser-sync'),
    $            = require('gulp-load-plugins')();

var paths        = require('./utils/paths'),
    handleErrors = require('./utils/handleErrors');


// browser-sync options for dev environment
function browserSyncInit() {
  return browserSync.init({
    server: {
      baseDir: './',
      directory: true
    },
    startPath: 'examples/dev.htm',
    notify: false,
    browser: 'google chrome'
  });
}


// add more default tasks here as needed
gulp.task('default', ['js', 'css']);


// run watch command to update files on save
gulp.task('watch', ['default'], function() {
  gulp.watch([paths.src.js + '**/*'], ['js']);
  gulp.watch([paths.src.css + '**/*'], ['css']);
});


// run serve command to start server at root
gulp.task('serve', ['watch'], function() {
  browserSyncInit();
});


// run test suite
gulp.task('test', function() {
  return gulp.src([''])
    .pipe($.testem({
      configFile: 'testem.json'
    }));
});
