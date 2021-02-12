const ChessBoard = require('chess.js').Chess;
const net = require('net');
const generateGameHash = require('garden-common/src/state').generateGameHash;
const parseLiveBoard = require('./parse/liveBoard');

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

function ObserverLoop(boardId, redis, config) {
  const connection = net.createConnection(config.port, config.host);

  let chessBoard = null;
  let gameHash = null;
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
  let lastMove = 0;
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
      gameHash = generateGameHash(home, away);
      lastMove = 0;
    });
  }

  const parseLiveGameData = (liveGameData, data) => {
    const boardData = parseLiveBoard(data);
    const isValidNewGame = gameId !== liveGameData[1]
      && (liveGameData[2].toLowerCase() === away || liveGameData[3].toLowerCase() === away);
    if (isValidNewGame) {
      gameId = liveGameData[1];
      chessBoard = new ChessBoard();
      runningMoveList = [];
      queueMoves = [];
      if (boardData.pgn) {
        queueMoves.push(boardData);
      }
      redis.del(gameHash, (err) => {
        if (err) {
          console.warn('Error deleting:', gameHash, err);
        }
        process.nextTick(() => connection.write(`pgn ${liveGameData[1]}\n`));
      });
      redis.set(`usate:viewer:game:${boardId}:id`, gameId, (err) => {
        if (err) {
          console.warn('Error setting:', gameId, err);
        }
        console.info('New gameId:', gameId);
      });
    } else if (!gameId) {
      console.info('nothing yet');
    } else if (queueMoves !== null) {
      queueMoves.push(boardData);
    } else if (!boardData.id || !boardData.pgn) {
      console.log('done?');
      chessBoard = new ChessBoard();
      runningMoveList = [];
      lastMove = 0;
      redis.del(gameHash, (err) => {
        if (err) {
          console.warn('Troubles removing the game hash:', gameHash, err);
        }
        redis.rpush(gameHash, JSON.stringify({
          type: 'goto',
          data: {
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            clock: [3600, 3600],
            moveList: [],
            moving: 'home'
          }
        }));
      });
    } else if (boardData.id < lastMove) {
      const diff = lastMove - boardData.id;
      for (let i = 0; i < diff; ++i) {
        chessBoard.undo();
        runningMoveList.pop();
        redis.rpop(gameHash);
      }
      lastMove = boardData.id;
    } else if (runningMoveList[runningMoveList - 1] !== boardData.pgn) {
      const move = chessBoard.move(boardData.pgn);
      console.log(runningMoveList, boardData.pgn);
      runningMoveList.push(boardData.pgn);
      lastMove = boardData.id;
      redis.rpush(gameHash, JSON.stringify({
        type: 'move',
        data: {
          id: chessBoard.history().length,
          pgn: move.san,
          fen: chessBoard.fen(),
          move: [move.from, move.to],
          clock: boardData.clock,
          moveList: runningMoveList.map(i => i),
          moving: move.color === 'w' ? 'home' : 'away'
        }
      }));
    }
  };

  const parseStaleGameData = (staleGameData, data) => {
    const pgnMoves = (data.match(pgnMovesRegex) || [''])[0];
    const moveList = [...pgnMoves.matchAll(individualMoveRegex)].map(i => i[1]);
    redis.rpush(gameHash, JSON.stringify({
      type: 'goto',
      data: {
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        clock: [3600, 3600],
        moveList: moveList.map(i => i),
        moving: 'home'
      }
    }), (err) => {
      if (err) {
        console.warn('Error pushing:', gameHash, err);
      }

      const firstQueuedMove = ((queueMoves || [])[0] || []).id || null;
      for (let i = 0, count = moveList.length; i < count; ++i) {
        if (firstQueuedMove !== null && i >= firstQueuedMove - 1) {
          break;
        }
        const move = chessBoard.move(moveList[i]);
        runningMoveList.push(moveList[i]);
        redis.rpush(gameHash, JSON.stringify({
          type: 'move',
          data: {
            id: chessBoard.history().length,
            pgn: move.san,
            fen: chessBoard.fen(),
            move: [move.from, move.to],
            clock: null,
            moving: move.color === 'w' ? 'home' : 'away'
          }
        }));
      }

      let nextQueueMove;
      while ((nextQueueMove = queueMoves.shift())) {
        if (nextQueueMove.pgn) {
          const move = chessBoard.move(nextQueueMove.pgn);
          runningMoveList.push(nextQueueMove.pgn);
          redis.rpush(gameHash, JSON.stringify({
            type: 'move',
            data: {
              id: chessBoard.history().length,
              pgn: move.san,
              fen: chessBoard.fen(),
              move: [move.from, move.to],
              clock: nextQueueMove.clock,
              moving: move.color === 'w' ? 'home' : 'away'
            }
          }));
        }
      }
      lastMove = runningMoveList.length;
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
