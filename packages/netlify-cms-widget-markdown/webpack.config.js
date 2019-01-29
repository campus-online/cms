const { getConfig } = require('../../scripts/webpack.js');

const baseConfig = getConfig()
module.exports = {
  ...baseConfig,
  entry: './src/serializers/index.js',
  target: 'node',
  output: {
    ...baseConfig.output,
    libraryTarget: 'commonjs2',
  },
};
