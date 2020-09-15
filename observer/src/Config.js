import _ from 'lodash';
import defaultConfig from './config/default.json';
import developmentConfig from './config/development.json';
import productionConfig from './config/production.json';
import runtimeConfig from './config/runtime.json';

function Config(environment) {
  return _.defaultsDeep(
    runtimeConfig,
    environment === 'production' 
      ? productionConfig 
      : developmentConfig,
    defaultConfig
  );
}

export default Config;
