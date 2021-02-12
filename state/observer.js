const path = require('path');
const common = require('garden-common');
const config = common.Config(process.env, require(path.join(__dirname, '../common/config/runtime.json')));
const redis = require('redis');

const observerLoop = parseInt(process.env.DIRECT_QUEUE) === 1
  ? require('./src/observer/direct')
  : require('./src/observer');

const client = redis.createClient();
client.on('connect', () => {
  console.log('Connected to Redis!');
  observerLoop(process.env.BOARD_ID, client, config.telnet[process.env.BOARD_ID]);
});
