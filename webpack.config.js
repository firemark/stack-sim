const path = require('path');

module.exports = {
  entry: './src/index.js',
  mode: 'production',
  output: {
    filename: 'script.js',
    path: path.resolve(__dirname, 'static'),
  },
  resolve: {
      alias: {
          '@': path.resolve(__dirname, 'src'),
      },
  },
};
