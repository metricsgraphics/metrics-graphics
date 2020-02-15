const path = require('path')

module.exports = {
  mode: 'production',
  entry: './src/js/MG.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'metrics-graphics.js',
    library: 'MG',
    libraryTarget: 'umd2'
  },
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /(node_modules|bower_components)/,
        use: 'babel-loader'
      }
    ]
  }
}
