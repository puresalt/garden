const path = require('path');
const common = require('garden-common');
const config = common.Config(process.env, require(path.join(__dirname, '../common/config/runtime.json')));
const Telnet = require('telnet-client');
const redis = require('redis');
const crawlerLoop = require('./src/crawler');

const client = redis.createClient();
client.on('connect', () => {
  console.log('Connected to Redis!');
});

const telnet = new Telnet();
telnet.on('ready', (prompt) => {
  crawlerLoop(telnet, client);
});

telnet.on('timeout', () => {
  process.exit();
});

telnet.on('close', () => {
  process.exit();
});

telnet.connect(config.telnet);
