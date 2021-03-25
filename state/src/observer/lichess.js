const axios = require('axios');
const ChessBoard = require('chess.js').Chess;
const duration = require('moment').duration;
const StringDecoder = require('string_decoder').StringDecoder;
const stringDecoder = new StringDecoder('utf8');

const individualMoveRegex = /([NBQRKOxa-h0-9=/+#-]+) { \[%clk ([0-9:]+)]/g;
const noop = () => {
};
const nullSocket = {
  sockets: {emit: noop},
  emit: noop
};

const gameList = {};

function ObserverLoop(boardId, redis, config) {
  let observing = null;
  let white = null;
  let black = null;
  let noGameFound = false;

  loopForUsernameChanges((usernames) => {
    observing = usernames;
    [white, black] = usernames.split(',');
    noGameFound = false;
    findGames();
  });

  function findGames() {
    axios.post(`/api/stream/games-by-users`, pairingPlayerList, {
      baseURL: 'https://lichess.org/',
      headers: {'Accept': 'application/json', 'Content-Type': 'text/plain'},
      responseType: 'stream'
    }).then((response) => {
        response.data
          .on('data', data => {
            const parsedData = stringDecoder.write(data);
            if (!parsedData.players || !parsedData.id) {
              return;
            }
            const homePlayer = parsedData.players.white.userId;
            const awayPlayer = parsedData.players.black.userId;
            db.query(
              `SELECT garden_member.id   as playerId,
                      garden_opponent.id as opponentId
               FROM garden_member
                        LEFT JOIN garden_opponent
                                  ON (garden_opponent.match_id = ? AND
                                      (garden_opponent.lichess_handle = ? OR garden_opponent.lichess_handle = ?))
               WHERE garden_member.lichess_handle = ?
                  OR garden_member.lichess_handle = ?;`, [matchId, homePlayer, awayPlayer, matchId, homePlayer, awayPlayer], (err, result) => {
                if (err || !result.length) {
                  console.log('Error retrieving player and opponent:', err, result.length);
                  return;
                }
                const updatedData = {
                  matchId: matchId,
                  player: {id: result[0].playerId},
                  opponent: {id: result[0].opponentId},
                  gameId: parsedData.id,
                  result: null
                };
              });
          });
      },
      err => console.error(err.message)
    );
  }


  function storeGame(redis, teamId, gameId, callback) {
    if (gameList[gameId] !== undefined) {
      return process.nextTick(() => callback('running already'));
    }
    gameList[gameId] = false;
    const gameHash = `game:${teamId}:${gameId}`;
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

    function nextLoop(data, checkState, finished) {
      switch (data.status) {
        case 'started':
          setTimeout(() => checkState(), 250);
          break;
        case 'aborted':
          finished('aborted', data);
          break;
        default:
          finished(null, data);
          break;
      }
    }

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
}

module.exports = ObserverLoop;
