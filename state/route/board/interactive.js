const generateGameHash = require('garden-common/src/state').generateGameHash;

function BoardInteractiveRoute(db, redis, socketWrapper, boardId) {
  let closed = false;
  let currentEventId = 0;
  let isPaused = false;
  let didJumpAround = false;
  let currentGameHash = null;
  let currentGameId = 0;
  const startGame = (gameHash, finished) => {
    currentEventId = 0;
    isPaused = false;
    didJumpAround = false;
    if (!gameHash) {
      return;
    }
    currentGameHash = gameHash;
    let eventList = [];
    const getGameEvents = (lastEventId) => {
      if (closed) {
        return;
      }
      redis.get(`garden:viewer:game:${boardId}:id`, (err, gameId) => {
        if (!currentGameId) {
          currentGameId = gameId;
        }
        if (err || !gameId || gameId !== currentGameId) {
          return finished(err);
        }
        redis.lrange(currentGameHash, lastEventId, -1, (err, result) => {
          if (err) {
            return finished(err);
          }
          if (gameId !== currentGameId) {
            return process.nextTick(() => finished());
          }
          eventList = eventList.concat(result.map(JSON.parse));

          if (!eventList.length) {
            return setTimeout(() => {
              getGameEvents(0);
            }, 500);
          }

          const makeNextEvent = (nextEventId) => {
            if (currentGameId !== gameId) {
              return process.nextTick(() => finished());
            }

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
                redis.rpush(`garden:viewer:game:${boardId}`, JSON.stringify(currentEvent));
                currentEventId = nextEventId;
              } else {
                nextEventId = currentEventId;
              }
              process.nextTick(() => makeNextEvent(nextEventId + 1));
            }, nextTimeout)
          };
          makeNextEvent(lastEventId);
        });
      });
    };

    getGameEvents(0);
  };

  function startSession() {
    socketWrapper.broadcast(`viewer:board:${boardId}:started`);
    didJumpAround = false;
    const getPlayerNames = () => {
      redis.get(`garden:stream:board:${boardId}`, (err, usernames) => {
        if (err) {
          console.warn('Error getting usernames:', err);
        }
        if (!usernames) {
          return;
        }
        redis.del(`garden:viewer:game:${boardId}`, (err) => {
          if (err) {
            return console.warn('Error deleting previous game events:', boardId, err);
          }
          const [home, away] = usernames.split(',');
          startGame(generateGameHash(home, away), (err) => {
            if (err) {
              console.warn('Error starting a game:', err);
            }
            currentGameId = 0;
            currentEventId = 0;
            currentGameHash = 0;
            setTimeout(getPlayerNames, 250);
          });
        });
      });
    };
    getPlayerNames();
  }

  function gotoPosition(data) {
    if (!currentGameHash) {
      return;
    }
    redis.lindex(currentGameHash, data.id + 1, (err, result) => {
      if (err || !result) {
        return console.warn('Error going to position:', err, currentGameHash);
      }
      if (err || !result) {
        return console.warn('Error adding goto:', err, currentGameHash);
      }
      didJumpAround = !data.stopJumping;
      isPaused = data.paused;
      currentEventId = data.id;
      const returnResult = JSON.parse(result);
      returnResult.type = 'goto';
      socketWrapper.emit(`board:${boardId}`, returnResult);
      redis.rpush(`garden:viewer:game:${boardId}`, JSON.stringify(returnResult));
    });
  }

  function drawShape(data) {
    redis.rpush(`garden:viewer:game:${boardId}`, JSON.stringify({
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
    closed = true;
    socketWrapper.off(`board:${boardId}:start`, startSession);
    socketWrapper.off(`board:${boardId}:draw`, drawShape);
    socketWrapper.off(`board:${boardId}:goto`, gotoPosition);
    socketWrapper.off(`board:${boardId}:pause`, updatePlayback);
  };
}

module.exports = BoardInteractiveRoute;
