const PLAYERS = require('garden-common/src/constant').PLAYERS;

function BoardViewerRoute(redis, socketWrapper, boardId) {
  const gameHash = `rapid:viewer:board:${boardId}`;

  function readySession() {
    socketWrapper.emit(gameHash, {
      type: 'goto',
      data: {
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        clock: [900, 900],
        moveList: [],
        moving: 'home'
      }
    });

    const emitName = (position) => {
      return (err, name) => {
        if (err || !name) {
          socketWrapper.emit(`${gameHash}:${position}`, PLAYERS['']);
          return;
        }
        socketWrapper.emit(`${gameHash}:${position}`, PLAYERS[name] || PLAYERS['']);
      }
    };
    redis.get(`${gameHash}:home`, emitName('home'));
    redis.get(`${gameHash}:away`, emitName('away'));

    redis.lrange(gameHash, 0, -1, (err, result) => {
      if (err) {
        return finished(err);
      }
      try {
        console.log(result, result[result.length - 1])
        const currentEvent = JSON.parse(result[result.length - 1] || 'false');
        if (currentEvent) {
          socketWrapper.emit(gameHash, currentEvent);
        }
      } catch (e) {
        console.log('Error parsing:', e);
      }
    });
  }

  socketWrapper.on(`${gameHash}:start`, readySession);
  return () => {
    socketWrapper.off(`${gameHash}:start`, readySession);
  };
}

module.exports = BoardViewerRoute;
