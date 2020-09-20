const path = require('path');
const common = require('gcss-common');
const config = common.Config(process.env, require(path.join(__dirname, '../common/config/runtime.json')));
const mysql = require('mysql');
const router = require('./router');

const dataStore = mysql.createConnection(config.state.mysql);

dataStore.connect((err) => {
  if (err) {
    console.error('Could not connect to MySQL:', err);
    process.exit();
    return;
  }
  if (process.env.PORT) {
    config.port.state = process.env.PORT;
  }
  router(dataStore, config);
});
