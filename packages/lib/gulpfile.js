const { src, dest, watch } = require('gulp')

const sass = require('gulp-sass')
sass.compiler = require('node-sass')

// paths
const distFolder = 'dist'
const sassFiles = 'src/mg.sass'

const compileSass = () =>
  src(sassFiles).pipe(sass().on('error', sass.logError)).pipe(dest(distFolder))

const watchSass = () => watch(sassFiles, compileSass)

exports.compileSass = compileSass
exports.watchSass = watchSass
