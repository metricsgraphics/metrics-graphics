const { join } = require('path')
const { src, dest, watch, series, parallel } = require('gulp')
const umd = require('gulp-umd')

const rimraf = require('gulp-rimraf')
const uglify = require('gulp-uglify')
const concat = require('gulp-concat')
const rename = require('gulp-rename')
const eslint = require('gulp-eslint')
const { reload, server } = require('gulp-connect')
const babel = require('gulp-babel')

const sass = require('gulp-sass')
sass.compiler = require('node-sass')

// paths
const distFolder = 'dist'
const jsFiles = 'src/js/**/*'
const sassFiles = 'src/sass/**/*'

const clean = () => {
  return src(join(distFolder, '*'), { read: false })
    .pipe(rimraf())
}

const buildJsRaw = () => {
  return src(jsFiles)
    .pipe(concat({ path: 'metricsgraphics.js' }))
    .pipe(babel({
      presets: ['env']
    }))
    .pipe(umd(
      {
        dependencies: function () {
          return [{
            name: 'd3',
            amd: 'd3',
            cjs: 'd3',
            global: 'd3',
            param: 'd3'
          }]
        },
        exports: function () {
          return 'MG'
        },
        namespace: function () {
          return 'MG'
        }
      }
    ))
    .pipe(dest(distFolder))
    .pipe(rename('metricsgraphics.min.js'))
    .pipe(uglify())
    .pipe(dest(distFolder))
}

const buildJs = series(clean, buildJsRaw)

const lint = () => {
  return src(jsFiles)
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
}

const compileSass = () => src(sassFiles)
  .pipe(sass().on('error', sass.logError))
  .pipe(dest(distFolder))

const watchSass = () => watch(sassFiles, compileSass)

const roots = ['dist', 'examples']
const watchables = roots.map(root => `${root}/**/*`)

const devReload = () => src(watchables).pipe(reload())
const devWatch = () => parallel(watch(watchables, devReload), watch(sassFiles, compileSass))

const devServe = () => server({
  root: roots,
  port: 4300,
  livereload: true
})

exports.clean = clean
exports.default = series(lint, buildJs, compileSass)
exports.serve = series(compileSass, devServe, devWatch)
exports.lint = lint
exports.compileSass = compileSass
exports.watchSass = watchSass
