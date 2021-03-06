const path = require('path');
const http = require('http');
const common = require('garden-common');
const config = common.Config(process.env, require(path.join(__dirname, '../common/config/runtime.json')));
const mysql = require('mysql');
const redis = require('redis');
const crawlerLoop = require('./src/crawler');

const db = mysql.createConnection(config.state.mysql);
const client = redis.createClient();
client.on('connect', () => {
  console.log('Connected to Redis!');
});

db.connect((err) => {
  if (err) {
    console.error('Could not connect to MySQL:', err);
    process.exit();
    return;
  }
  if (process.env.PORT) {
    config.port.state = process.env.PORT;
  }
  crawlerLoop(db, client, 1, process.env.MATCH_ID, config);
});
