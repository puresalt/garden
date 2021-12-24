const net = require('net');
const parseLiveBoard = require('./parse/liveBoard');

const WAIT_TO_FIND_GAME_AGAIN = 5000;

const matchResults = {
  '0': 0,
  '1': 1,
  '1/2': 0.5,
  '0.5': 0.5,
  '.5': 0.5
};

function ObserverLoop(redis, connection, boardId) {
  const boardHash = `rapid:viewer:board:${boardId}`;

  connection.on('data', (incomingData) => {
    const data = incomingData.toString();
    console.info('>', data);
    parseIncomingData(data);
  });

  process.nextTick(() => observeGame());

  const sendCommand = (command, ...attributes) => {
    const sending = [command, attributes.join(' ')].join(' ');
    console.info('CMD:', sending);
    connection.write(`${sending}\n`);
  };

  const pushStartPosition = (callback) => {
    redis.rpush(boardHash, JSON.stringify({
      type: 'goto',
      data: {
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        clock: [900, 900],
        moveList: [],
        moving: 'home'
      }
    }), (err) => {
      if (err) {
        console.error('ERROR STORING START POSITION', err);
      }
      callback && callback(err);
    });
  };

  const pushPosition = (position, callback) => {
    redis.rpush(boardHash, JSON.stringify({
      type: 'goto',
      data: {...position, moveList: []}
    }), (err) => {
      if (err) {
        console.error('ERROR STORING:', position, err);
      }
      callback && callback(err);
    });
  };

  const nameChange = (position, name) => {
    redis.set(`${boardHash}:${position}`, name);
  };

  let latestPosition = null;
  let home = '';
  let away = '';
  let sleeping = false;

  function observeGame() {
    latestPosition = null;
    away = '';
    home = '';
    sleeping = false;
    sendCommand('observe', boardId);
  }

  const liveGameRegex = /<12> [a-zA-Z-]+ [a-zA-Z-]+ [a-zA-Z-]+ [a-zA-Z-]+ [a-zA-Z-]+ [a-zA-Z-]+ [a-zA-Z-]+ [a-zA-Z-]+ [W|B] [0-9-]+ [01] [01] [01] [01] [0-9]+ ([0-9]+) ([-a-zA-Z0-9-*_]+) ([-a-zA-Z0-9-*_]+).+[\n\r]/g;

  function parseIncomingData(data) {
    if (sleeping) {
      return;
    }

    if (data.indexOf('There is no such game.') > -1) {
      sleeping = true;
      setTimeout(() => observeGame(), WAIT_TO_FIND_GAME_AGAIN);
      return;
    }

    const boardEvents = ([...data.matchAll(liveGameRegex)] || [])
      .filter(row => row[1] === boardId)
      .map(row => row[0].trim().split('<12>')[1]);
    if (boardEvents.length) {
      latestPosition = parseLiveBoard(boardEvents[boardEvents.length - 1]);
      if (latestPosition.away !== away) {
        home = latestPosition.home;
        nameChange('home', home);
      }
      if (latestPosition.away !== away) {
        away = latestPosition.away;
        nameChange('away', away);
      }
      if (latestPosition.id === 0) {
        pushStartPosition();
      } else {
        pushPosition({...latestPosition});
      }
    }
  }
}

module.exports = (redis, boardId, config) => {
  const loginPromptRegex = /login: $/;
  const passwordPromptRegex = /password: /;

  const connection = net.createConnection(config.port, config.host);
  const logOn = (buffer) => {
    const data = buffer.toString().toLowerCase();
    if (loginPromptRegex.test(data)) {
      connection.write(`${config.username}\n`);
    } else if (passwordPromptRegex.test(data)) {
      connection.write(`${config.password}\n`);
      connection.off('data', logOn);
      process.nextTick(() => ObserverLoop(redis, connection, boardId));
    }
  };
  connection.on('data', logOn);
  connection.on('timeout', () => {
    console.info('Connection timed out');
    process.exit();
  });
  connection.on('end', () => {
    console.info('Connection ended');
    process.exit();
  });
};
