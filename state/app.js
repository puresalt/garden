const path = require('path');
const common = require('garden-common');
const config = common.Config(process.env.NODE_ENV, require(path.join(__dirname, '../common/config/runtime.json')));
const redis = require('redis');
const router = require('./router');

const client = redis.createClient();
client.on('connect', () => {
  console.log('Connected to Redis!');
  router(client, config);
});

