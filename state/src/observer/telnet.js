const net = require('net');
const {EVENT_TYPE} = require('garden-common/src/constant');
const BughouseObserver = require('./telnet/bughouse');
const RegularObserver = require('./telnet/regular');

/**
 * Telnet based live board observer. Covers ICC and FICS.
 *
 * @param {Object} event
 * @param {redis} redis
 * @param {{username: String, password: String}} config
 */
module.exports = (event, redis, config) => {
  const loginPromptRegex = /login: $/;
  const passwordPromptRegex = /password: $/;

  const Observer = event.type === EVENT_TYPE.BUGHOUSE
    ? BughouseObserver
    : RegularObserver;

  const connection = net.createConnection(config.port, config.host);

  const sendCommand = (command, ...attributes) => {
    const sending = [command, attributes.join(' ')].join(' ');
    console.log('CMD:', sending);
    connection.write(`${sending}\n`);
  };

  const logOn = (buffer) => {
    const data = buffer.toString().toLowerCase();
    if (loginPromptRegex.test(data)) {
      connection.write(`${config.username}\n`);
    } else if (passwordPromptRegex.test(data)) {
      connection.write(`${config.password}\n`);
      connection.off('data', logOn);
      process.nextTick(() => Observer(connection, event.pairingId, redis, sendCommand, config.endOfCommand || 'aics%', config.pgnCommandName || 'pgn'));
    }
  };
  connection.on('data', logOn);
  connection.on('timeout', () => {
    console.log('Connection timed out');
    process.exit();
  });
  connection.on('end', () => {
    console.log('Connection ended');
    process.exit();
  });
};
