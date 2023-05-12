const baseConfig = require('../../config/tailwind.config.base');

module.exports = {
  ...baseConfig,
  corePlugins: {
    preflight: false,
  },
};
