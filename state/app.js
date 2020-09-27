const path = require('path');
const common = require('garden-common');
const config = common.Config(process.env.NODE_ENV, require(path.join(__dirname, '../common/config/runtime.json')));
const mysql = require('mysql');
const redis = require('redis');
const router = require('./router');

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
  router(db, client, config);
});
