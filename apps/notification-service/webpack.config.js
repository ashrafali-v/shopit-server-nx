const { composePlugins, withNx } = require('@nx/webpack');
const path = require('path');

module.exports = composePlugins(withNx(), (config) => {
  // Update the webpack config as needed here.
  config.mode = 'development';

  // Update the entry point
  config.entry = {
    main: path.resolve(__dirname, 'src/main.ts')
  };

  return config;
});
