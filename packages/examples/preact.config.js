// copied from https://dev.to/boywithsilverwings/configuring-preact-cli-with-tailwind-css-3ckj
module.exports = (config, env, helpers, params) => {
  const purgecss = require('@fullhuman/postcss-purgecss')({
    // Specify the paths to all of the template files in your project
    content: ['./build/**/*.js', './build/**/*.html'],
    css: ['./build/**/*.css'],
    whitelist: ['body']
  })

  const postCssLoaders = helpers.getLoadersByName(config, 'postcss-loader')
  postCssLoaders.forEach(({ loader }) => {
    const plugins = loader.options.plugins

    // Add tailwind css at the top.
    plugins.unshift(require('tailwindcss'))

    // Add PurgeCSS only in production.
    if (env.production) {
      plugins.push(purgecss)
    }
  })
  return config
}
