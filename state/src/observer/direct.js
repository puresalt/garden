const net = require('net');
const ChessBoard = require('chess.js').Chess;
const parseLiveBoard = require('../parse/liveBoard');

const READ_TERMINATE = 'aics%';

const loginPromptRegex = /login: $/;
const passwordPromptRegex = /password: /;
const newGameIdRegex = /Game ([0-9]+): PassersObs[1|2|3|4] goes forward [0-9]+./;
const observeResponseRegex = /Game ([0-9]+) \(([a-zA-Z0-9_-]+) vs\. ([a-zA-Z0-9_-]+)\)/;
const pgnResponseRegex = /[\s\S]+\[Site [\s\S]+/;
const pgnExamineBoardMatch = '| P | P | P | P | P | P | P | P |     White Strength : 39';
const resultsResponseRegex = /{Game ([0-9]+) \(([a-zA-Z0-9_-]+) vs\. ([a-zA-Z0-9_-]+)\) ([a-zA-Z0-9_-]+) ([a-zA-Z0-9 ]+)} (0|0.5|1)-(0|0.5|1)[\s\S]+/;
const historyResponseRegex = /^Recent games of ([a-zA-Z0-9_-]+)[\s\S]+/;
const historyResultRegex = /([0-9]+): ([-+=]) [0-9]+ [B|W] [0-9]+ ([a-zA-Z0-9_-]+)\s+\[/;
const pgnMovesRegex = /1. ([NBQRKOxa-h0-9=/+#\s\S .-]+)$/;
const noExaminersRegex = /game [0-9]+ \(which you were observing\) has no examiners./;
const individualMoveRegex = /([NBQRKOxa-h0-9=/+#-]+)\s/g;
const winnerMap = {
  '+': 'home',
  '-': 'away',
  '=': null
};

const buildPosition = (moveList) => {
  const chessBoard = new ChessBoard();
  let move;
  let lastValidMove;
  for (let i = 0, count = moveList.length; i < count; ++i) {
    move = chessBoard.move(moveList[i]);
    if (!move) {
      break
    }
    lastValidMove = move;
  }
  return lastValidMove ? {
    id: chessBoard.history().length,
    pgn: lastValidMove.san,
    fen: chessBoard.fen(),
    move: [lastValidMove.from, lastValidMove.to],
    clock: [3600, 3600],
    moveList: moveList,
    moving: lastValidMove.color === 'w' ? 'home' : 'away'
  } : null;
};

function ObserverLoop(boardId, redis, config) {
  const gameHash = `usate:viewer:game:${boardId}`;

  const connection = net.createConnection(config.port, config.host);

  let pgnWaitedFor = false;
  let gameIdWaitedFor = null;
  let loadingMoveList = false;
  let usingHistoryOnly = false;
  let gameHasEnded = false;
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
  let lastMove = 0;
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
      connection.write(`unex\n`);
      connection.write(`obs ${home}\n`);
      gameId = null;
      checkingHistory = false;
      checkedHistory = false;
      queueMoves = null;
      lastMove = 0;
      loadingMoveList = false;
      usingHistoryOnly = false;
      gameHasEnded = false;
      gameIdWaitedFor = null;
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
        });
      });
    } else if (!gameId) {
      console.info('nothing yet');
    } else if (queueMoves !== null) {
      queueMoves.push(boardData);
    } else if (boardData.id && boardData.id > lastMove && boardData.pgn) {
      runningMoveList.push(boardData.pgn);
      lastMove = boardData.id;
      redis.rpush(gameHash, JSON.stringify({
        type: 'goto',
        data: {
          id: boardData.id,
          pgn: boardData.pgn,
          fen: boardData.fen,
          clock: boardData.clock,
          moveList: runningMoveList,
          moving: boardData.moving
        }
      }));
    }
  };

  const parseStaleGameData = (staleGameData, data) => {
    const pgnMoves = (data.match(pgnMovesRegex) || [''])[0];

    const moveList = [...pgnMoves.matchAll(individualMoveRegex)].map(i => i[1]);
    const firstQueuedMove = ((queueMoves || [])[0] || []).id || null;
    for (let i = 0, count = moveList.length; i < count; ++i) {
      if (firstQueuedMove !== null && i >= firstQueuedMove - 1) {
        break;
      }
      runningMoveList.push(moveList[i]);
    }

    let queuedMove;
    if (queueMoves !== null) {
      while ((queuedMove = queueMoves.shift())) {
        if (queuedMove.pgn) {
          runningMoveList.push(queuedMove.pgn);
        }
      }
    }

    if (!queuedMove) {
      queuedMove = buildPosition(runningMoveList);
      runningMoveList = runningMoveList.slice(0, queuedMove.id);
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
      lastMove = queuedMove.id;
    }

    loadingMoveList = false;
    queueMoves = null;
  };

  const parseResultsData = (resultsData, data) => {
    let winner = null;
    if (resultsData[6] === '1') {
      winner = 'home';
    } else if (resultsData[6] === '0') {
      winner = 'away';
    }
    redis.rpush(gameHash, JSON.stringify({
      type: 'result',
      data: {
        winner: winner
      }
    }));
    gameHasEnded = true;
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
    usingHistoryOnly = true;
    let matches = 0;
    const probableGame = historyData[0].split('\n').map((row, i) => {
      const hasMatch = row.trim().match(historyResultRegex);
      if (hasMatch) {
        ++matches;
        if (away.indexOf(hasMatch[3].toLowerCase()) === 0) {
          return [hasMatch[1], hasMatch];
        }
      }
      return null;
    }).filter(i => i !== null)[0];
    if (probableGame) {
      loadingMoveList = true;
      redis.del(gameHash, (err) => {
        if (err) {
          console.warn('Error deleting:', gameHash, err);
        }
        redis.del(`usate:viewer:game:${boardId}`, (err) => {
            if (err) {
              console.warn('Error setting:', gameId, err);
            }
            gameId = `${home}:${probableGame[1][1]}`;
            connection.write(`examine ${home} ${probableGame[0]}\n`);
            const waitForPgn = () => {
              if (!pgnWaitedFor) {
                return setTimeout(waitForPgn, 100);
              }
              redis.set(`usate:viewer:game:${boardId}:id`, gameId, (err) => {
                process.nextTick(() => {
                  gameIdWaitedFor = false;
                  connection.write(`forward 999\n`);
                  process.nextTick(() => {
                    connection.write(`pgn\n`);
                    const waitForHistory = () => {
                      if (gameIdWaitedFor === null || (gameIdWaitedFor && gameIdWaitedFor !== gameId)) {
                        return;
                      }
                      if (!gameIdWaitedFor || loadingMoveList) {
                        return setTimeout(waitForHistory, 100);
                      }
                      gameHasEnded = true;
                      const queuedMove = buildPosition(runningMoveList);

                      if (queuedMove) {
                        runningMoveList = runningMoveList.slice(0, queuedMove.id);
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
                      redis.rpush(gameHash, JSON.stringify({
                        type: 'result',
                        data: {
                          winner: winnerMap[probableGame[1][2]]
                        }
                      }));
                      gameIdWaitedFor = null;
                    };
                    process.nextTick(waitForHistory);
                  });
                });
              });
            };
            waitForPgn();
          }
        );
      });
    }
  };
  const noHistoryData = () => {
    checkingHistory = false;
    checkedHistory = true;
    setTimeout(() => connection.write(`obs ${home}\n`), 1000);
  }

  const clientOn = (buffer) => {
    if (gameHasEnded) {
      console.log('Ignored, waiting for a new game to start.');
    }

    const data = buffer.toString().replace(READ_TERMINATE, '');
    const lowerCaseData = data.toLowerCase().trim();

    const newGameId = data.match(newGameIdRegex);
    if (newGameId !== null) {
      gameIdWaitedFor = newGameId[1];
      gameId = newGameId[1];
      return;
    }
    if (
      lowerCaseData === notLoggedIn
      || lowerCaseData === notPlaying
      || noExaminersRegex.test(lowerCaseData)
    ) {
      return checkHistory();
    }

    if (data.indexOf(pgnExamineBoardMatch) > -1) {
      pgnWaitedFor = true;
      return;
    }

    if (lowerCaseData === noHistoryResponse) {
      return noHistoryData();
    }

    const resultsData = data.match(resultsResponseRegex);
    if (resultsData !== null) {
      return parseResultsData(resultsData, data);
    }

    const staleGameData = data.match(pgnResponseRegex);
    if (staleGameData !== null) {
      return parseStaleGameData(staleGameData, data);
    }

    const liveGameData = data.match(observeResponseRegex);
    if (liveGameData !== null && !usingHistoryOnly) {
      return parseLiveGameData(liveGameData, data);
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
