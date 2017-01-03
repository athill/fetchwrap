var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: [
    './src/fetchwrap.js'
  ],
  output: {
      publicPath: '/bin',
      filename: 'bin/index.js'
  },
  module: {
    loaders: [
      { 
        test: /\.js$/,
        include: path.join(__dirname, 'src'),
        loader: 'babel-loader',
        query: {
          presets: ['es2015', 'stage-2']
        }
      }
    ]
  }
};