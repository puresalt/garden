const ChessBoard = require('chess.js').Chess;
const duration = require('moment').duration;
const net = require('net');
const generateGameHash = require('garden-common/src/state').generateGameHash;
const parseLiveBoard = require('./parse/liveBoard');

const loginPromptRegex = /login: $/;
const passwordPromptRegex = /password: /;
const observeResponseRegex = /Game ([0-9]+) \(([a-zA-Z0-9_-]+) vs\. ([a-zA-Z0-9_-]+)\)/;
const pgnResponseRegex = /\n\[Site "Internet Chess Club"]\n/;
const resultsResponseRegex = /^{Game ([0-9]+) (([a-zA-Z0-9_-]+) vs. ([a-zA-Z0-9_-]+)) ([a-zA-Z0-9_-]+) ([a-zA-Z0-9]+)} (0|0.5|1)-(0|0.5|1)/;

const individualMoveRegex = /([NBQRKOxa-h0-9=/+#-]+) { \[%clk ([0-9:]+)]/g;
const noop = () => {
};
const nullSocket = {
  sockets: {emit: noop},
  emit: noop
};

function ObserverLoop(boardId, redis, config) {
  let loggedIn = false;
  const connection = net.createConnection(config.port, config.host);

  let observing = null;
  let home = null;
  let away = null;
  let gameId = null;
  let moves = null;
  let queueMoves = null;
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
      connection.write(`unobs\n`);
      connection.write(`obs ${home}\n`);
      gameId = null;
    });
  }

  const parseLiveGameData = (liveGameData, data) => {
    const boardData = parseLiveBoard(data);
    if (gameId === null) {
      if (queueMoves === null) {
        queueMoves = [];
        if (
          (liveGameData[2] === home && liveGameData[3] === away)
          || (liveGameData[3] === home && liveGameData[2] === away)
        ) {
          moves = (new Array(boardData.id)).fill(null);
          connection.write(`pgn ${liveGameData[1]}\n`);
        }
      } else {
        queueMoves.push(boardData);
      }
    }
    console.log('liveGameData', liveGameData);
  };

  const parseStaleGameData = (staleGameData, data) => {
    console.log('parseStaleGameData', data);
  };

  const parseResultsData = (resultsData, data) => {
    console.log('parseResultsData', data);
  };

  const clientOn = (buffer) => {
    const data = buffer.toString();
    const liveGameData = data.match(observeResponseRegex);
    if (liveGameData !== null) {
      return parseLiveGameData(liveGameData, data);
    }

    const staleGameData = data.match(pgnResponseRegex);
    if (staleGameData !== null) {
      return parseStaleGameData(staleGameData, data);
    }

    const resultsData = data.match(resultsResponseRegex);
    if (resultsData !== null) {
      return parseResultsData(resultsData, data);
    }

    console.log(data);
  };

  const logOn = (buffer) => {
    const data = buffer.toString();
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

  return;

  function checkPairingDataList() {
    const alreadyCrawledGameList = Object.keys(gameList).length
      ? `AND lichess_game_id NOT IN (${Object.keys(gameList).map(item => db.escape(item)).join(",")})`
      : '';
    db.query(`SELECT *
              FROM garden_pairing
              WHERE match_id = ?
                AND lichess_game_id IS NOT NULL
                ${alreadyCrawledGameList};`, matchId, (err, result) => {
      if (err) {
        console.log('Error retrieving pairings:', err);
        return;
      }
      if (!result.length) {
        return;
      }
      for (let i = 0, count = result.length; i < count; ++i) {
        ((item) => {
          console.log('Found:', item.lichess_game_id);
          storeGame(redis, telnet, (err, result) => {
            if (err) {
              console.error('Error getting data for:', matchId, result, err);
              return;
            }
            const updatedData = {
              matchId: matchId,
              player: {id: item.member_id},
              opponent: {id: item.opponent_id},
              gameId: item.lichess_game_id,
              result: null
            };
            if (item.id) {
              updatedData.id = item.id;
            }
            if (result.status === 'draw') {
              updatedData.result = 0.5;
              return updatePairing(db, nullSocket, nullSocket, teamId, updatedData, (err) => {
                if (err) {
                  return console.error('Error storing a draw for:', matchId, item, result, err);
                }
                console.log('Completed and set a draw for:', item, result);
              });
            }
            if (!result.winner) {
              console.log('Completed:', item, result);
            }
            const winnerUsername = result.players[result.winner].user.userId;
            db.query(`SELECT COUNT(*) AS count
                      FROM garden_member
                      WHERE lichess_handle = ?;`, [winnerUsername], (err, winner) => {
              if (err) {
                return console.error('Error finding the username to store a result for:', matchId, item, result, err);
              }
              updatedData.result = winner.length && winner[0].count ? 1 : 0;
              updatePairing(db, nullSocket, nullSocket, teamId, updatedData, (err) => {
                if (err) {
                  return console.error('Error storing a result for:', matchId, item, result, err);
                }
                console.log('Completed and set a result for:', item, result);
              });
            });
          });
        })(result[i]);
      }
    });
  }

  setInterval(checkPairingDataList, 100);
}

function storeGame(redis, teamId, gameId, callback) {
  if (gameList[gameId] !== undefined) {
    return process.nextTick(() => callback('running already'));
  }
  gameList[gameId] = false;
  const gameHash = `usate:game:${gameId}`;
  const chessBoard = new ChessBoard();
  let lastPgn = null;
  let clock = [];
  let firstRun = true;

  redis.lrange(gameHash, 0, 1, (err, data) => {
    if (err || data.length) {
      return process.nextTick(() => callback(err || 'Already Imported', data));
    }
    getGame(gameId, (err, data) => {
      if (err) {
        return process.nextTick(() => callback(err, data));
      }
      const allDone = (err) => {
        gameList[gameId] = true;
        return process.nextTick(() => callback(err, data));
      };

      if (data.status === 'draw') {
        redis.rpush(gameHash, JSON.stringify({type: 'result', data: 'draw'}), allDone);
      } else if (data.winner === 'white') {
        redis.rpush(gameHash, JSON.stringify({type: 'result', data: 'win'}), allDone);
      } else if (data.winner === 'black') {
        redis.rpush(gameHash, JSON.stringify({type: 'result', data: 'loss'}), allDone);
      }
    });
  });

  function addMoveToHistory(incomingMove, timeLeft, next) {
    const move = chessBoard.move(incomingMove);
    if (move === null) {
      return process.nextTick(() => next('Error parsing:', [clock, timeLeft, incomingMove]));
    }
    const clockAtPoint = [
      clock[0],
      clock[1],
      clock[2],
      clock[3]
    ];
    const clockOffset = move.color === 'w' ? 0 : 1;
    clockAtPoint[clockOffset] = duration(timeLeft).as('seconds');
    clockAtPoint[2] = (clock[clockOffset] - clockAtPoint[clockOffset]) + clock[3];
    clock = clockAtPoint;
    redis.rpush(gameHash, JSON.stringify({
      type: 'move',
      data: {
        id: chessBoard.history().length,
        pgn: move.san,
        fen: chessBoard.fen(),
        move: [move.from, move.to],
        clock: clockAtPoint,
        moving: move.color === 'w' ? 'home' : 'away'
      }
    }), next);
  }


  function getGame(currentGameId, finished) {
    checkState();

    function checkState() {
      axios.get(`/game/export/${gameId}`, {
        baseURL: 'https://lichess.org/',
        headers: {Accept: 'application/json'},
        requestType: 'json',
        params: {
          pgnInJson: true,
          clocks: true,
          opening: false,
          literate: false,
          tags: false,
          moves: true
        }
      }).then(response => {
          if (currentGameId !== gameId) {
            return finished(`gameId changed: ${currentGameId} to ${gameId}`);
          }
          let moveList = [];
          let firstRow = false;
          if (lastPgn === null) {
            clock = [
              response.data.clock.initial,
              response.data.clock.initial,
              0,
              response.data.clock.increment
            ];
            lastPgn = response.data.pgn.trim();
            moveList = [...lastPgn.matchAll(individualMoveRegex)];
            firstRow = {
              type: 'goto',
              data: {
                fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                clock: clock,
                moveList: moveList.map(item => item[1]),
                moving: 'home'
              }
            };
          } else if (lastPgn.length !== response.data.pgn.length) {
            moveList = [...response.data.pgn.substr(lastPgn.length).matchAll(individualMoveRegex)];
            lastPgn = response.data.pgn.trim();
            firstRow = {
              type: 'goto',
              data: {
                fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                clock: clock,
                moveList: [...lastPgn.matchAll(individualMoveRegex)].map(item => item[1]),
                moving: 'home'
              }
            };
          }
          moveList = moveList.map(item => [item[1], item[2]]);

          const makeNextMove = (moveId) => {
            if (firstRow) {
              const firstRowJson = JSON.stringify(firstRow);
              firstRow = false;
              const startMoves = (err) => {
                if (err) {
                  return process.nextTick(() => finished(err));
                }
                process.nextTick(() => makeNextMove(moveId));
              };
              if (firstRun) {
                firstRun = false;
                return redis.rpush(gameHash, firstRowJson, startMoves);
              } else {
                return redis.lset(gameHash, 0, firstRowJson, startMoves);
              }
            }
            const nextMove = moveList[moveId];
            if (!nextMove) {
              return nextLoop(response.data, checkState, finished);
            }
            addMoveToHistory(nextMove[0], nextMove[1], (err) => {
              if (err) {
                return process.nextTick(() => finished(err));
              }
              process.nextTick(() => makeNextMove(moveId + 1));
            });
          };
          makeNextMove(0);
        },
        err => console.error(err.message)
      );
    }
  }
}

module.exports = ObserverLoop;
