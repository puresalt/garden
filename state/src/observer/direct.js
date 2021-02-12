const net = require('net');
const ChessBoard = require('chess.js').Chess;
const parseLiveBoard = require('../parse/liveBoard');

const READ_TERMINATE = 'aics%';

const loginPromptRegex = /login: $/;
const passwordPromptRegex = /password: /;
const observeResponseRegex = /Game ([0-9]+) \(([a-zA-Z0-9_-]+) vs\. ([a-zA-Z0-9_-]+)\)/;
const pgnResponseRegex = /[\s\S]+\[Site [\s\S]+/;
const resultsResponseRegex = /^{Game ([0-9]+) \(([a-zA-Z0-9_-]+) vs\. ([a-zA-Z0-9_-]+)\) ([a-zA-Z0-9_-]+) ([a-zA-Z0-9 ]+)} (0|0.5|1)-(0|0.5|1)[\s\S]+/;
const historyResponseRegex = /^Recent games of ([a-zA-Z0-9_-]+)[\s\S]+/;
const pgnMovesRegex = /1. ([NBQRKOxa-h0-9=/+#\s\S .-]+)$/;
const noExaminersRegex = /game [0-9]+ \(which you were observing\) has no examiners./;
const individualMoveRegex = /([NBQRKOxa-h0-9=/+#-]+)\s/g;

const buildPosition = (moveList) => {
  const chessBoard = new ChessBoard();
  let move;
  for (let i = 0, count = moveList.length; i < count; ++i) {
    move = chessBoard.move(moveList[i]);
    if (!move) {
      return null;
    }
  }
  return {
    id: chessBoard.history().length,
    pgn: move.san,
    fen: chessBoard.fen(),
    move: [move.from, move.to],
    clock: [3600, 3600],
    moveList: moveList,
    moving: move.color === 'w' ? 'home' : 'away'
  };
};

function ObserverLoop(boardId, redis, config) {
  const gameHash = `usate:viewer:game:${boardId}`;

  const connection = net.createConnection(config.port, config.host);

  let loadingMoveList = false;

  let loggedIn = false;
  let observing = null;
  let home = null;
  let away = null;
  let gameId = null;
  let queueMoves = null;
  let notLoggedIn = null
  let notPlaying = null;
  let noHistoryResponse = null;
  let checkingHistory = false;
  let checkedHistory = false;
  let runningMoveList = [];
  const loopForUsernameChanges = () => {
    redis.get(`usate:stream:board:${boardId}`, (err, usernames) => {
      if (err) {
        console.warn('Error finding players, will try again in a bit:', err);
      }
      if (!usernames || observing === usernames) {
        return;
      }
      observing = usernames;
      [home, away] = usernames.split(',');
      notLoggedIn = `${home} is not logged in.`;
      notPlaying = `${home} is not playing or examining a game.`;
      noHistoryResponse = `${home} has no games record.`;
      connection.write(`unobs\n`);
      connection.write(`obs ${home}\n`);
      gameId = null;
      checkingHistory = false;
      checkedHistory = false;
      queueMoves = null;
      lastMove = 0;
    });
  }

  const parseLiveGameData = (liveGameData, data) => {
    const boardData = parseLiveBoard(data);
    const isValidNewGame = gameId !== liveGameData[1]
      && (liveGameData[2].toLowerCase() === away || liveGameData[3].toLowerCase() === away);
    if (isValidNewGame) {
      loadingMoveList = true;
      gameId = liveGameData[1];
      runningMoveList = [];
      queueMoves = [];
      if (boardData.pgn) {
        queueMoves.push(boardData);
      }
      redis.del(gameHash, (err) => {
        if (err) {
          console.warn('Error deleting:', gameHash, err);
        }
        redis.set(`usate:viewer:game:${boardId}:id`, gameId, (err) => {
          if (err) {
            console.warn('Error setting:', gameId, err);
          }
          console.info('New gameId:', gameId);
          process.nextTick(() => connection.write(`pgn ${liveGameData[1]}\n`));
          const waitForPgn = () => {
            if (loadingMoveList) {
              setTimeout(() => waitForPgn(), 250);
            }
          };
          waitForPgn();
        });
      });
    } else if (!gameId) {
      console.info('nothing yet');
    } else if (queueMoves !== null) {
      queueMoves.push(boardData);
    } else if (boardData.id && boardData.pgn) {
      redis.rpush(gameHash, JSON.stringify({
        type: 'goto',
        data: {
          id: runningMoveList.length,
          pgn: boardData.pgn,
          fen: boardData.fen,
          clock: boardData.clock,
          moveList: runningMoveList,
          moving: boardData.color === 'w' ? 'home' : 'away'
        }
      }));
    }
  };

  const parseStaleGameData = (staleGameData, data) => {
    const pgnMoves = (data.match(pgnMovesRegex) || [''])[0];
    redis.rpush(gameHash, JSON.stringify({
      type: 'goto',
      data: {
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        clock: [3600, 3600],
        moveList: [],
        moving: 'home'
      }
    }), (err) => {
      if (err) {
        console.warn('Error pushing:', gameHash, err);
      }

      const moveList = [...pgnMoves.matchAll(individualMoveRegex)].map(i => i[1]);
      const firstQueuedMove = ((queueMoves || [])[0] || []).id || null;
      for (let i = 0, count = moveList.length; i < count; ++i) {
        if (firstQueuedMove !== null && i >= firstQueuedMove - 1) {
          break;
        }
        runningMoveList.push(moveList[i]);
      }

      let queuedMove;
      while ((queuedMove = queueMoves.shift())) {
        if (queuedMove.pgn) {
          runningMoveList.push(queuedMove.pgn);
        }
      }

      if (!queuedMove) {
        queuedMove = buildPosition(runningMoveList);
      }

      if (queuedMove) {
        redis.rpush(gameHash, JSON.stringify({
          type: 'goto',
          data: {
            id: queuedMove.id,
            pgn: queuedMove.pgn,
            fen: queuedMove.fen,
            clock: queuedMove.clock,
            moveList: runningMoveList,
            moving: queuedMove.moving
          }
        }));
      }

      loadingMoveList = false;
      queueMoves = null;
    });
  };

  const parseResultsData = (resultsData, data) => {
    console.log('parseResultsData', resultsData, data);
  };

  const checkHistory = () => {
    if (checkingHistory) {
      return;
    }
    if (checkedHistory) {
      return setTimeout(() => connection.write(`obs ${home}\n`), 1000);
    }
    checkingHistory = true;
    connection.write(`history ${home}\n`);
  };
  const parseHistoryData = (historyData, data) => {
    checkingHistory = false;
    checkedHistory = true;
  };
  const noHistoryData = () => {
    checkingHistory = false;
    checkedHistory = true;
    setTimeout(() => connection.write(`obs ${home}\n`), 1000);
  }

  const clientOn = (buffer) => {
    const data = buffer.toString().replace(READ_TERMINATE, '');
    const lowerCaseData = data.toLowerCase().trim();

    if (
      lowerCaseData === notLoggedIn
      || lowerCaseData === notPlaying
      || noExaminersRegex.test(lowerCaseData)
    ) {
      return checkHistory();
    }

    if (lowerCaseData === noHistoryResponse) {
      return noHistoryData();
    }

    const resultsData = data.match(resultsResponseRegex);
    if (resultsData !== null) {
      return parseResultsData(resultsData, data);
    }

    const liveGameData = data.match(observeResponseRegex);
    if (liveGameData !== null) {
      return parseLiveGameData(liveGameData, data);
    }

    const staleGameData = data.match(pgnResponseRegex);
    if (staleGameData !== null) {
      return parseStaleGameData(staleGameData, data);
    }

    const historyData = data.match(historyResponseRegex);
    if (historyData !== null) {
      return parseHistoryData(historyData, data);
    }

    console.log(data);
  };

  const logOn = (buffer) => {
    const data = buffer.toString().toLowerCase();
    if (loggedIn) {
      return;
    }
    if (loginPromptRegex.test(data)) {
      connection.write(`${config.username}\n`);
    } else if (passwordPromptRegex.test(data)) {
      connection.write(`${config.password}\n`);
      connection.on('data', clientOn);
      connection.off('data', logOn);
      loggedIn = true;
      setInterval(loopForUsernameChanges, 1000);
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
}

module.exports = ObserverLoop;
