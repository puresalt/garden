const _ = require('lodash');

function Config(environment, runtimeConfig) {
  const defaultConfig = require('../config/default.json');
  const environmentConfig = environment === 'production'
    ? require('../config/production.json')
    : require('../config/development.json');
  const processConfig = process.env.GSCC_CONFIG
    ? JSON.parse(process.env.GSCC_CONFIG)
    : {};

  return _.defaultsDeep(
    processConfig,
    runtimeConfig || {},
    environmentConfig,
    defaultConfig
  );
}

module.exports = Config;
