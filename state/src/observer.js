const net = require('net');
const ChessBoard = require('../node_modules/chess.js/chess').Chess;
const parseLiveBoard = require('./parse/liveBoard');

const END_OF_COMMAND = 'aics%';

const matchResults = {
  '0': 0,
  '1': 1,
  '1/2': 0.5,
  '0.5': 0.5,
  '.5': 0.5
};

const convertToSeconds = (raw) => {
  const clock = raw.split(':').map(i => i.trim());
  const fragments = clock.map(i => parseInt(i.trim()));
  let seconds = fragments.pop();
  let minutes = (fragments.pop() || 0) * 60;
  let hours = (fragments.pop() || 0) * 60 * 60;
  return seconds + minutes + hours;
};

const buildPosition = (moveList, startingClock, increment) => {
  const chessBoard = new ChessBoard();
  let move;
  let lastValidMove;
  const clock = startingClock || [1500, 1500];
  increment = increment || 5;
  const moves = [];
  for (let i = 0, count = moveList.length; i < count; ++i) {
    move = chessBoard.move(moveList[i][0]);
    if (!move) {
      break;
    }
    moves.push(move.san);
    const time = convertToSeconds(moveList[i][1]);
    clock[i % 2 === 1 ? 0 : 1] += increment - time;
    lastValidMove = move;
  }
  return lastValidMove
    ? {
      id: chessBoard.history().length,
      pgn: lastValidMove.san,
      fen: chessBoard.fen(),
      move: [lastValidMove.from, lastValidMove.to],
      clock: clock,
      moveList: moves,
      moving: lastValidMove.color === 'w' ? 'home' : 'away'
    }
    : null;
};

function ObserverLoop(connection, boardId, redis) {
  const sendCommand = (command, ...attributes) => {
    const sending = [command, attributes.join(' ')].join(' ');
    console.info('CMD:', sending);
    connection.write(`${sending}\n`);
  };
  const boardHash = `college:viewer:game:${boardId}`;
  const pushPosition = (position, callback) => {
    redis.rpush(boardHash, JSON.stringify({
      type: 'goto',
      data: position
    }), (err) => {
      if (err) {
        console.error('ERROR STORING:', position);
      }
      callback && callback(err);
    });
  };

  const clearGameHistory = (callback) => {
    console.info('Clearing history to look for:', observing);
    process.nextTick(() => pushPosition({
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      clock: [1500, 1500],
      moveList: [],
      moving: 'home',
      pauseClocks: true
    }, callback));
  };

  let observing = null;
  let currentCommand = null;
  let noGameFound = false;
  const loopForSeekParameterChanges = () => {
    redis.get(`college:stream:board:${boardId}`, (err, seekParameters) => {
      if (err) {
        console.warn('Error finding players, will try again in a bit:', err);
      }
      if (!seekParameters || observing === seekParameters) {
        return;
      }
      observing = seekParameters;
      const parameters = seekParameters.split(' ');
      noGameFound = false;
      switch (parameters[0]) {
        case 'find':
          findGames(parameters[1], parameters[2]);
          break;
        case 'smoves':
          clearGameHistory(() => getSmoves(parameters[1], parameters[2]));
          break;
        case 'observe':
          clearGameHistory(() => observeGame(parameters[1]));
          break;
        case 'clear':
          clearGameHistory(() => console.log('Board cleared'));
      }
    });
  }
  process.nextTick(() => setInterval(loopForSeekParameterChanges, 500));

  let hopefullyGameId = null;
  let runningMoves = null;
  let positionIsLive = false;
  let latestPosition = null;
  let pgnData = '';
  let waitingForPgnData = false;

  function observeGame(gameId) {
    currentCommand = 'observeGame';
    hopefullyGameId = gameId;
    pgnData = '';
    waitingForPgnData = false;
    runningMoves = null;
    positionIsLive = false;
    latestPosition = null;
    sendCommand('observe', gameId);
  }

  const liveGameRegex = /<12> [a-zA-Z-]+ [a-zA-Z-]+ [a-zA-Z-]+ [a-zA-Z-]+ [a-zA-Z-]+ [a-zA-Z-]+ [a-zA-Z-]+ [a-zA-Z-]+ [W|B] [0-9-]+ [01] [01] [01] [01] [0-9]+ ([0-9]+) ([a-zA-Z0-9-]+) ([a-zA-Z0-9-]+).+[\n\r]/g;
  const pgnRegexMatch = /[\s\S]+\[Site [\s\S]+/;
  const pgnMovesRegex = /1. ([NBQRKOxa-h0-9=/+#\s\S .-]+)$/;
  const individualMoveRegex = /([NBQRKOxa-h0-9=/+#-]+)[\s\r\n]+{([0-9:]+)}/g;

  const gameOverRegex = /{Game ([0-9]+) \([a-zA-Z0-9-]+ vs\. [a-zA-Z0-9-]+\) [a-zA-Z0-9-]+ ([a-z ]+)} ([2/01]+)-[2/01]+/;
  const getGameOver = data => data.match(gameOverRegex);
  const isPgn = data => pgnRegexMatch.test(data);

  function gameObserver(data) {
    if (data.indexOf('There is no such game.') === -1) {
      const gameOverData = getGameOver(data);
      const pushGameOverData = gameOverData && gameOverData[1] === hopefullyGameId
        ? {
          pauseClocks: true,
          result: matchResults[gameOverData[3]],
          by: gameOverData[2]
        }
        : false;
      if (waitingForPgnData || isPgn(data)) {
        waitingForPgnData = data.indexOf(END_OF_COMMAND) === -1;
        pgnData += data;
        if (!waitingForPgnData) {
          const pgnMoves = (pgnData.match(pgnMovesRegex) || [''])[0];
          const currentPosition = buildPosition([...pgnMoves.matchAll(individualMoveRegex)].map(i => [i[1], i[2]]));
          const moveList = (currentPosition || {}).moveList || [];
          for (let i = 0, count = moveList.length; i < count; ++i) {
            runningMoves[i] = moveList[i];
          }
          positionIsLive = true;
          if (!latestPosition) {
            latestPosition = currentPosition;
          }
          if (latestPosition && !gameOverData) {
            pushPosition({...latestPosition, moveList: runningMoves});
          }
        }
        return;
      } else {
        const boardEvents = ([...data.matchAll(liveGameRegex)] || [])
          .filter(row => row[1] === hopefullyGameId)
          .map(row => row[0].trim().split('<12>')[1]);
        if (boardEvents.length) {
          for (let i = 0, count = boardEvents.length; i < count; ++i) {
            const boardData = parseLiveBoard(boardEvents[i]);
            const boardDataId = boardData.id || 0;
            if (runningMoves === null) {
              runningMoves = new Array(boardData.id - 1).fill(null);
              if (!latestPosition || boardDataId > latestPosition.id) {
                latestPosition = boardData;
              }
              if (boardDataId) {
                runningMoves[boardData.id - 1] = boardData.pgn;
              }
              sendCommand('pgn', hopefullyGameId);
            } else if (boardDataId) {
              runningMoves[boardData.id - 1] = boardData.pgn;
              if (!latestPosition || boardDataId > latestPosition.id) {
                latestPosition = boardData;
                if (!gameOverData) {
                  pushPosition({...latestPosition, moveList: runningMoves});
                }
              }
            }
          }
        }
      }
      if (!gameOverData) {
        return;
      }
      if (latestPosition) {
        if (pushGameOverData.by === 'forfeits on time') {
          latestPosition.clock[pushGameOverData.result] = 0;
        }
        pushPosition({...latestPosition, ...pushGameOverData, moveList: runningMoves});
      }
    }

    console.info('Finished storing game:', observing);
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

  const individualGameHistoryRegex = /([0-9]+): [-+=] [0-9]+ [B|W] [0-9]+ ([a-zA-Z0-9_-]+)\s+\[[a-zA-Z0-9 ]+] [a-zA-Z0-9]+ [a-zA-Z0-9]+/g;
  let white = null;
  let black = null;

  function findHistoryObserver(data) {
    currentCommand = null;
    if (!emptyGameHistoryRegex.test(data)) {
      const historyList = [...(data.matchAll(individualGameHistoryRegex) || [])];
      const against = searchingHistoryFor === white
        ? black
        : white;
      if (historyList.length) {
        const probableGame = historyList.map((row, i) => {
          return against.indexOf(row[2].toLowerCase()) > -1
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
  let gameListData = '';

  function findGames(findWhite, findBlack) {
    white = findWhite;
    black = findBlack;
    currentCommand = 'findGames';
    foundGame = null;
    gameListData = '';
    gameListRegex = new RegExp(`([0-9]+)[ ]+[0-9]+[ ]+${white}[a-zA-Z0-9() ]+${black}[a-zA-Z0-9() ]+[a-zA-Z]+[ ]+[0-9]+[ ]+[0-9]+[ ]+[W|B]:[ ]+[0-9]+`, 'i');
    clearGameHistory(() => sendCommand(`games`));
  }

  function findGameObserver(data) {
    gameListData += data;
    if (data.indexOf(END_OF_COMMAND) > -1) {
      currentCommand = null;
      foundGame = gameListData.match(gameListRegex);
      if (foundGame !== null) {
        return observeGame(foundGame[1]);
      } else {
        findHistory(white);
      }
    }
  }

  const smovesListRegex = /\s+([NBQRKOxa-h0-9=/+#-]+)\s+\(([0-9:]+)\)/g;
  const smovesStartTimeRegex = /initial time: ([0-9]+)/;
  const smovesIncrementRegex = /increment: ([0-9]+)/;
  const smovesMatchResultRegex = /[White|Black] ([a-z]+)} ([120/]+)-[120/]+/;
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
      if (data.indexOf('Game database temporarily unavailable.') > -1) {
        if (smovesWaiting > 15) {
          console.warn('Giving up on:', smovesPlayer, smovesIndex);
          noGameFound = true;
          currentCommand = null;
          smovesPlayer = null;
          smovesIndex = null;
          smovesWaiting = 0;
          return;
        }
        return setTimeout(() => {
          getSmoves(smovesPlayer, smovesIndex, smovesWaiting + 1);
        }, 500);
      }
      const foundMoves = moveListData.matchAll(smovesListRegex);
      if (!foundMoves) {
        noGameFound = true;
      }
      const startTime = parseInt((moveListData.match(smovesStartTimeRegex) || [null, 5])[1]) * 60;
      const increment = parseInt((moveListData.match(smovesIncrementRegex) || [null, 5])[1]);
      const matchResultData = moveListData.match(smovesMatchResultRegex);
      const finalPosition = buildPosition([...foundMoves].map(i => [i[1], i[2]]), [startTime, startTime], increment);
      if (finalPosition) {
        if (matchResultData) {
          finalPosition.result = matchResults[matchResultData[2]];
          finalPosition.by = matchResultData[1];
        }
        pushPosition({...finalPosition, pauseClocks: true}, (err) => {
          noGameFound = false;
          currentCommand = null;
          smovesPlayer = null;
          smovesIndex = null;
          smovesWaiting = 0;
          console.info('Finished storing game:', observing);
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
  connection.on('data', (incomingData) => {
    const data = incomingData.toString();
    console.info('>', data);
    if (observing === null || noGameFound) {
      return console.info('Nothing to observe');
    }
    if (observerList[currentCommand]) {
      observerList[currentCommand](data);
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
    console.info('Connection timed out');
    process.exit();
  });
  connection.on('end', () => {
    console.info('Connection ended');
    process.exit();
  });
};
