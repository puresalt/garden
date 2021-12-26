const PLAYERS = require('garden-common/src/constant').PLAYERS;

function BoardViewerRoute(redis, socketWrapper, boardId) {
  const gameHash = `rapid:viewer:board:${boardId}`;

  function readySession() {
    socketWrapper.emit(gameHash, {
      type: 'goto',
      data: {
        id: 0,
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

    redis.lrange(gameHash, 0, -1, (err, eventList) => {
      if (err) {
        return console.warn('Error catching up or nothing in the list to catch up to:', boardId, eventList, err);
      }

      let lastEventId = eventList.length;
      let currentEventId;
      let currentEvent;
      let resultEvent;
      for (currentEventId = lastEventId - 1; currentEventId > 0; --currentEventId) {
        try {
          currentEvent = JSON.parse(eventList[currentEventId]);
          if (currentEvent && currentEvent.type) {
            if (currentEvent.type === 'goto' || currentEvent.type === 'start') {
              socketWrapper.emit(gameHash, currentEvent);
              if (resultEvent) {
                process.nextTick(() => socketWrapper.emit(gameHash, resultEvent));
              }
              break;
            } else if (currentEvent.type === 'result') {
              resultEvent = currentEvent;
            }
          }
        } catch (e) {
          console.log('Error parsing:', e);
        }
      }
    });
  }

  socketWrapper.on(`${gameHash}:start`, readySession);
  return () => {
    socketWrapper.off(`${gameHash}:start`, readySession);
  };
}

module.exports = BoardViewerRoute;
