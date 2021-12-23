const path = require('path');
const common = require('garden-common');
const config = common.Config(process.env, require(path.join(__dirname, '../common/config/runtime.json')));
const redis = require('redis');
const observerLoop = require('./src/observer');

const client = redis.createClient();
client.on('connect', () => {
  console.log('Connected to Redis!');
  observerLoop(client, process.env.BOARD_ID, config.telnet[process.env.BOARD_ID]);
});
