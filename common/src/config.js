const _ = require('lodash');

function Config(environment, runtimeConfig) {
  const defaultConfig = require('../config/default.json');
  const environmentConfig = environment === 'production' || environment === 'prod'
    ? require('../config/production.json')
    : require('../config/development.json');
  const processConfig = process.env.GARDEN_CONFIG
    ? JSON.parse(process.env.GARDEN_CONFIG)
    : {};

  const config = _.defaultsDeep(
    {},
    processConfig,
    runtimeConfig || {},
    environmentConfig,
    defaultConfig
  );
  Object.freeze(config);

  return config;
}

module.exports = Config;
