const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable minification and compression optimizations in production builds
const isProduction =
  process.env.NODE_ENV === 'production' ||
  process.env.EAS_BUILD_PROFILE === 'production';

if (isProduction) {
  config.transformer.minifierConfig = {
    ...config.transformer.minifierConfig,
    compress: {
      drop_console: true,
      drop_debugger: true,
      passes: 2,
      dead_code: true,
      unused: true,
      collapse_vars: true,
      reduce_vars: true,
    },
  };
}

module.exports = config;
