const updatePairing = require('../pairing').updatePairing;

function BoardInteractiveRoute(db, redis, socketWrapper, boardId) {
  let currentEventId = 0;
  let isPaused = false;
  let didJumpAround = false;
  const startGame = (finished) => {
    socketWrapper.emit(`board:${boardId}`, {
      type: 'goto',
      data: {
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        clock: [3600, 3600, 0, 10],
        moveList: [],
        moving: 'home'
      }
    });
    currentEventId = 0;
    isPaused = false;
    didJumpAround = false;
    let eventList = [];
    const getGameEvents = (lastEventId) => {
      redis.lrange(`usate:game:${boardId}`, lastEventId, -1, (err, result) => {
        if (err) {
          return console.warn('Error getting events:', boardId);
        }
        eventList = eventList.concat(result.map(JSON.parse));

        if (!eventList.length) {
          return setTimeout(() => {
            getGameEvents(0);
          }, 500);
        }

        const makeNextEvent = (nextEventId) => {
          if (isPaused) {
            if (currentEventId > nextEventId) {
              nextEventId = currentEventId + 1;
            }
            return setTimeout(() => makeNextEvent(nextEventId), 500);
          }
          if (!eventList[nextEventId]) {
            return setTimeout(() => getGameEvents(nextEventId), 500);
          }
          const currentEvent = eventList[nextEventId];
          if (currentEvent === null) {
            lastEventId = 0;
            return process.nextTick(() => finished('Could not process:', currentEvent));
          }

          let nextTimeout = ((currentEvent.data.clock || [0, 0, 0.5])[2] * 1000);
          if (didJumpAround || nextTimeout < 500) {
            nextTimeout = 500;
          }
          setTimeout(() => {
            if (isPaused) {
              if (currentEventId > nextEventId) {
                nextEventId = currentEventId + 1;
              }
              return setTimeout(() => makeNextEvent(nextEventId), 200);
            }
            if ((!currentEventId && !nextEventId) || (currentEventId === nextEventId - 1)) {
              socketWrapper.emit(`board:${boardId}`, currentEvent);
              redis.rpush(`usate:viewer:game:${boardId}`, JSON.stringify(currentEvent));
              currentEventId = nextEventId;
            } else {
              nextEventId = currentEventId;
            }
            process.nextTick(() => makeNextEvent(nextEventId + 1));
          }, nextTimeout)
        };
        makeNextEvent(lastEventId);
      });
    };

    getGameEvents(0);
  };

  function startSession(data) {
    redis.del(`usate:viewer:game:${boardId}`, (err) => {
      if (err) {
        return console.warn('Error deleting previous game events:', boardId, err);
      }
      socketWrapper.broadcast(`viewer:board:${boardId}:started`, {
        orientation: data.orientation
      });
      didJumpAround = false;
      startGame((err) => {
        if (err) {
          console.warn('Error starting a game:', err);
        }
      })
    });
  }

  function gotoPosition(data) {
    redis.lindex(`usate:game:${boardId}`, data.id + 1, (err, result) => {
      if (err || !result) {
        return console.warn('Error going to position:', err);
      }
      if (err || !result) {
        return console.warn('Error adding goto:', err);
      }
      didJumpAround = !data.stopJumping;
      isPaused = data.paused;
      currentEventId = data.id;
      const returnResult = JSON.parse(result);
      returnResult.type = 'goto';
      socketWrapper.emit(`board:${boardId}`, returnResult);
      redis.rpush(`usate:viewer:game:${boardId}`, JSON.stringify(returnResult));
    });
  }

  function drawShape(data) {
    redis.rpush(`usate:viewer:game:${boardId}`, JSON.stringify({
      type: 'draw',
      data: data
    }));
  }

  function updatePlayback(state) {
    isPaused = state;
  }

  socketWrapper.on(`board:${boardId}:start`, startSession);
  socketWrapper.on(`board:${boardId}:draw`, drawShape);
  socketWrapper.on(`board:${boardId}:goto`, gotoPosition);
  socketWrapper.on(`board:${boardId}:pause`, updatePlayback);
  return () => {
    socketWrapper.off(`board:${boardId}:start`, startSession);
    socketWrapper.off(`board:${boardId}:draw`, drawShape);
    socketWrapper.off(`board:${boardId}:goto`, gotoPosition);
    socketWrapper.off(`board:${boardId}:pause`, updatePlayback);
    startGame(null, () => {
    });
  };
}

module.exports = BoardInteractiveRoute;
