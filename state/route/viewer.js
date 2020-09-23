const axios = require('axios');
const ChessBoard = require('chess.js').Chess;
const StringDecoder = require('string_decoder').StringDecoder;
const stringDecoder = new StringDecoder('utf8');

const individualMoveRegex = /([NBQRKOxa-h0-9=/-]+) { \[%clk ([0-9:]+)]/g;

function ViewerRoute(db, redis, io, socket, teamId) {

  function startGame(gameId) {
    const checkForMoves = (start) => {
      const pushEvents = (moves, next) => {
        let nextMove = moves.shift();
        if (nextMove === null) {
          return next(nextMove);
        }
        nextMove = JSON.parse(nextMove);
        setTimeout(() => pushEvents(moves, next), nextMove.timeout);
      };
      redis.lrange(`board:${gameId}`, start || 0, -1, (err, events) => {
        pushEvents(events, (finalState) => {
          // No new moves, let's wait.
          if (finalState === null) {
            setTimeout(() => checkForMoves(last), 250);
          }
        });
      });
    };

    setTimeout(_ => {
      socket.emit(boardName, {
        type: 'move',
        data: {id: 1, pgn: 'e4 ', move: ['e2', 'e4'], clock: [900, 900], moving: 'away'}
      });
      setTimeout(_ => {
        socket.emit(boardName, {
          type: 'move',
          data: {id: 2, pgn: 'e5 ', move: ['e7', 'e5'], clock: [900, 900], moving: 'home'}
        });
        setTimeout(_ => {
          socket.emit(boardName, {
            type: 'move',
            data: {id: 3, pgn: 'Nc3 ', move: ['b1', 'c3'], clock: [897, 900], moving: 'away'}
          });
          setTimeout(_ => socket.emit(boardName, {
            type: 'move',
            data: {id: 4, pgn: 'Nf6 ', move: ['g8', 'f6'], clock: [897, 899], moving: 'home'}
          }), 1000);
          setTimeout(_ => {
            socket.emit(boardName, {
              type: 'draw',
              data: [{orig: 'e2', dest: 'e4', brush: 'green'}]
            });
            setTimeout(_ => {
              socket.emit(boardName, {
                type: 'draw',
                data: [{orig: 'e2', dest: 'e4', brush: 'green'}, {orig: 'e7', dest: 'e5', brush: 'blue'}]
              });
              setTimeout(_ => {
                socket.emit(boardName, {type: 'start', data: {clock: [900, 900]}});
                setTimeout(_ => example(boardName), 5000);
              }, 5000);
            }, 2000);
          }, 2000);
        }, 3000);
      }, 2000);
    }, 100);

    return () => {
    };
  }

  socket.on('board:start', startGame);
  return () => {
    socket.off('board:start', startGame);
  };
}

module.exports = ViewerRoute;
