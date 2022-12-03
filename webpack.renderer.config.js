const rules = require('./webpack.rules');
const webpack = require('webpack')



rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
});

rules.push({
  test: /\.less$/i,
  use: [
    { loader: 'style-loader' }, 
    { loader: 'css-loader' },
    { 
      loader: 'less-loader',
      options: {
        lessOptions: {
            javascriptEnabled: true,
        }
      } 
    },
  ]
});

module.exports = {
  // Put your normal webpack config below here
  module: {
    rules,
  },
  plugins: [ 
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
    })
  ]
};
