const VueLoaderPlugin = require('vue-loader/lib/plugin')
const merge = require('webpack-merge');
const path = require('path');


var commons = {
  mode: 'development',
  output: {
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        use: 'vue-loader'
      }, {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: /node_modules/
      }, {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      }
    ]
  },
  plugins: [
    new VueLoaderPlugin()
  ],
}

module.exports = [
  merge(commons, {
    entry: './src/index.js',
    output: {
      filename: 'wg-volcano-plot.min.js',
      libraryExport: "default",
      libraryTarget: 'var',
      library: 'WgVolcanoPlot'
    }
  }),
  merge(commons, {
    entry: './src/WgVolcanoPlot.vue',
    output: {
      filename: 'wg-volcano-plot.umd.js',
      libraryTarget: 'umd',
      library: 'WgVolcanoPlot'
    }
  })
]
