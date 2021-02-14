const net = require('net');
const ChessBoard = require('chess.js').Chess;
const parseLiveBoard = require('../parse/liveBoard');

const END_OF_COMMAND = 'aics%';

const convertToSeconds = (raw) => {
  const clock = raw.split(':').map(i => i.trim());
  const fragments = clock.map(i => parseInt(i.trim()));
  let seconds = fragments.pop();
  let minutes = (fragments.pop() || 0) * 60;
  let hours = (fragments.pop() || 0) * 60 * 60;
  return seconds + minutes + hours;
};

const buildPosition = (moveList) => {
  const chessBoard = new ChessBoard();
  let move;
  let lastValidMove;
  const clock = [3600, 3600];
  const moves = [];
  for (let i = 0, count = moveList.length; i < count; ++i) {
    move = chessBoard.move(moveList[i][0]);
    if (!move) {
      break
    }
    moves.push(move.san);
    const time = convertToSeconds(moveList[i][1]);
    clock[i % 2 === 1 ? 0 : 1] += 10 - time;
    lastValidMove = move;
  }
  return lastValidMove ? {
    id: chessBoard.history().length,
    pgn: lastValidMove.san,
    fen: chessBoard.fen(),
    move: [lastValidMove.from, lastValidMove.to],
    clock: clock,
    moveList: moves,
    moving: lastValidMove.color === 'w' ? 'home' : 'away'
  } : null;
};

function ObserverLoop(connection, boardId, redis) {
  const sendCommand = (command, ...attributes) => {
    const sending = [command, attributes.join(' ')].join(' ');
    console.info('CMD:', sending);
    connection.write(`${sending}\n`);
  };
  const boardHash = `usate:viewer:game:${boardId}`;
  const pushPosition = (position, callback) => {
    redis.rpush(boardHash, JSON.stringify({
      type: 'goto',
      data: position
    }), (err) => {
      if (err) {
        console.log('ERROR STORING:', position);
      }
      callback && callback(err);
    });
  };

  const clearGameHistory = (callback) => {
    console.log('clearing history to look for:', white, black);
    pushPosition({
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      clock: [3600, 3600],
      moveList: [],
      moving: 'home'
    }, callback);
  };

  let white = null;
  let black = null;
  let observing = null;
  let currentCommand = null;
  let noGameFound = false;
  const loopForUsernameChanges = () => {
    redis.get(`usate:stream:board:${boardId}`, (err, usernames) => {
      if (err) {
        console.warn('Error finding players, will try again in a bit:', err);
      }
      if (!usernames || observing === usernames) {
        return;
      }
      observing = usernames;
      [white, black] = usernames.split(',');
      noGameFound = false;
      findGames();
    });
  }
  process.nextTick(() => setInterval(loopForUsernameChanges, 500));

  let hopefullyGameId = null;
  let runningMoves = null;

  function observeGame(gameId) {
    currentCommand = 'observeGame';
    hopefullyGameId = gameId;
    runningMoves = null;
    sendCommand('observe', gameId);
  }

  const liveGameRegex = /Game ([0-9]+) \([a-zA-Z0-9_()-]+ vs\. [a-zA-Z0-9_()-]+\)/;
  const pgnRegexMatch = /[\s\S]+\[Site [\s\S]+/;
  const pgnMovesRegex = /1. ([NBQRKOxa-h0-9=/+#\s\S .-]+)$/;
  const individualMoveRegex = /([NBQRKOxa-h0-9=/+#-]+)\s/g;

  const gameOverRegex = /^{.*} ([2/01-]+)/;
  const isGameOver = data => data.match(gameOverRegex);
  const isPgn = data => pgnRegexMatch.test(data);

  function gameObserver(data) {
    if (data.indexOf('There is no such game.') === -1) {
      if (isGameOver(data)) {
        currentCommand = null;
        console.log('Finished storing live game:', observing);
      } else if (isPgn(data)) {
        const pgnMoves = (data.match(pgnMovesRegex) || [''])[0];
        const currentPosition = buildPosition([...pgnMoves.matchAll(individualMoveRegex)].map(i => [i[1], '0 : 00']));
        const moveList = (currentPosition || {}).moveList || [];
        for (let i = 0, count = moveList.length; i < count; ++i) {
          if (runningMoves[i]) {
            break;
          }
          runningMoves[i] = moveList[i];
        }
        const lastPosition = !currentPosition || (runningMoves[runningMoves.length - 1] && runningMoves[runningMoves.length - 1].id > currentPosition)
          ? runningMoves[runningMoves.length - 1]
          : currentPosition;
        if (lastPosition) {
          pushPosition({...lastPosition, moveList: runningMoves});
        }
      } else {
        const liveGameId = (data.match(liveGameRegex) || [])[1];
        if (liveGameId === hopefullyGameId) {
          const boardData = parseLiveBoard(data);
          const boardDataId = boardData.id || 0;
          if (runningMoves === null) {
            runningMoves = new Array(0).fill(null);
            if (boardDataId) {
              runningMoves[boardData.id - 1] = boardData.pgn;
            }
            sendCommand('pgn', hopefullyGameId);
          } else if (boardDataId) {
            runningMoves.push(boardData.pgn);
            pushPosition({...boardData, moveList: runningMoves});
          }
        }
      }
      return;
    }

    currentCommand = null;
    noGameFound = true;
  }

  let searchingHistoryFor = null;
  let emptyGameHistoryRegex = null;

  function findHistory(historyFor) {
    currentCommand = 'findHistory';
    searchingHistoryFor = historyFor;
    emptyGameHistoryRegex = new RegExp(`${searchingHistoryFor} has no games record.`, 'i');
    process.nextTick(() => sendCommand('history', historyFor));
  }

  const individualGameHistoryRegex = /([0-9]+): [-+=] [0-9]+ [B|W] [0-9]+ ([a-zA-Z0-9_-]+)\s+\[/g;

  function findHistoryObserver(data) {
    currentCommand = null;
    if (!emptyGameHistoryRegex.test(data)) {
      const historyList = [...(data.matchAll(individualGameHistoryRegex) || [])];
      const against = searchingHistoryFor === white
        ? black
        : white;
      if (historyList.length) {
        const probableGame = historyList.map((row, i) => {
          return against.indexOf(row[2].toLowerCase())
            ? row[1]
            : null;
        }).filter(i => i !== null)[0];
        if (probableGame) {
          return getSmoves(searchingHistoryFor, probableGame);
        }
      }
    }

    noGameFound = true;
  }

  let gameListRegex = null;
  let foundGame = null;

  function findGames() {
    currentCommand = 'findGames';
    foundGame = null;
    gameListRegex = new RegExp(`([0-9]+)[ ]+[0-9]+[ ]+${white}[a-zA-Z0-9() ]+${black}[a-zA-Z0-9() ]+[a-zA-Z]+[ ]+[0-9]+[ ]+[0-9]+[ ]+[W|B]:[ ]+[0-9]+`, 'i');
    clearGameHistory(() => sendCommand(`games`));
  }


  function findGameObserver(data) {
    if (foundGame === null) {
      foundGame = data.match(gameListRegex);
    }
    if (data.indexOf(END_OF_COMMAND) > -1) {
      currentCommand = null;
      if (foundGame !== null) {
        return observeGame(foundGame[1]);
      } else {
        findHistory(white);
      }
    }
  }

  const smovesListRegex = /\s+([NBQRKOxa-h0-9=/+#-]+)\s+\(([0-9:]+)\)/g;
  const abjournedGamesRegex = /([a-zA-Z0-9_-]+) has no adjourned games./i;
  const noGameFoundRegex = /([a-zA-Z0-9_-]+) has no game numbered [0-9]+/i;

  let moveListData = null;
  let smovesPlayer = null;
  let smovesIndex = null;
  let smovesWaiting = 0;
  function getSmoves(player, index, incomingSmovesWaiting) {
    currentCommand = 'smoves';
    moveListData = '';
    smovesPlayer = player;
    smovesIndex = index;
    smovesWaiting = incomingSmovesWaiting || 0;
    process.nextTick(() => sendCommand('smoves', player, index));
  }

  function smovesObserver(data) {
    if (data.indexOf('You may use "smoves" if you specify an argument.') > -1 || abjournedGamesRegex.test(data) || noGameFoundRegex.test(data)) {
      noGameFound = true;
      currentCommand = null;
      return;
    }

    moveListData += data;
    if (data.indexOf(END_OF_COMMAND) > -1) {
      if(data.indexOf('Game database temporarily unavailable.') > -1) {
        if (smovesWaiting > 15) {
          console.warn('Giving up on:', smovesPlayer, smovesIndex);
          noGameFound = true;
          currentCommand = null;
          smovesPlayer = null;
          smovesIndex = null;
          smovesWaiting = 0;
          return
	}
        return setTimeout(() => {
          getSmoves(smovesPlayer, smovesIndex, smovesWaiting + 1);
	}, 500);
      }
      const foundMoves = moveListData.matchAll(smovesListRegex);
      if (!foundMoves) {
        noGameFound = true;
      }
      const finalPosition = buildPosition([...foundMoves].map(i => [i[1], i[2]]));
      if (finalPosition) {
        pushPosition(finalPosition, (err) => {
          noGameFound = false;
          currentCommand = null;
          smovesPlayer = null;
          smovesIndex = null;
          smovesWaiting = 0;
          console.log('Finished storing game:', observing);
        });
      }
    }
  }

  const observerList = {
    findGames: findGameObserver,
    findHistory: findHistoryObserver,
    smoves: smovesObserver,
    observeGame: gameObserver
  };
  connection.on('data', (data) => {
	  console.log(data.toString());
    if (observing === null || noGameFound) {
      return console.info('Nothing to observe');
    }
    if (observerList[currentCommand]) {
      observerList[currentCommand](data.toString());
    }
  });
}

module.exports = (boardId, redis, config) => {
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
      process.nextTick(() => ObserverLoop(connection, boardId, redis));
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
