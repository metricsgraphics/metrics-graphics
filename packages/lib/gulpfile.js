const { src, dest, watch } = require('gulp')

const eslint = require('gulp-eslint')

const sass = require('gulp-sass')
sass.compiler = require('node-sass')

// paths
const distFolder = 'dist'
const jsFiles = 'src/js/**/*'
const sassFiles = 'src/sass/**/*'

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

exports.lint = lint
exports.compileSass = compileSass
exports.watchSass = watchSass
