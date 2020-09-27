const updatePairing = require('../pairing').updatePairing;

function BoardInteractiveRoute(db, redis, socketWrapper, teamId, boardId) {
  let currentGameId = null;
  let currentEventId = 0;
  let isPaused = false;
  let gameHash = null;
  let didJumpAround = false;
  const startGame = (gameId, finished) => {
    if (!gameId) {
      socketWrapper.emit(`board:${boardId}`, {
        type: 'goto',
        data: {
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          clock: [900, 900, 0, 2],
          moveList: [],
          moving: 'home'
        }
      });
      redis.del(`game:${teamId}:${boardId}:current`, (err) => {
        if (err) {
          console.warn('Could not delete current gameId:', teamId, boardId, currentGameId, err);
        }
        finished(`no gameId: ${gameId} (${typeof gameId})`);
        currentEventId = 0;
        isPaused = false;
        gameHash = null;
        didJumpAround = false;
        currentGameId = null;
      });
      return;
    }
    currentEventId = 0;
    isPaused = false;
    gameHash = null;
    didJumpAround = false;
    currentGameId = gameId;
    gameHash = `game:${teamId}:${currentGameId}`;
    redis.set(`game:${teamId}:${boardId}:current`, currentGameId, (err) => {
      if (err) {
        return console.warn('Could not set current gameId:', teamId, boardId, currentGameId, err);
      }
      console.info(`Updated game:${teamId}:${boardId}:current to`, currentGameId);
    });
    let eventList = [];
    const getGameEvents = (lastEventId) => {
      redis.lrange(gameHash, lastEventId, -1, (err, result) => {
        if (err) {
          return console.warn('Error getting events:', gameId);
        }
        eventList = eventList.concat(result.map(JSON.parse));

        if (!eventList.length) {
          return setTimeout(() => {
            getGameEvents(0);
          }, 500);
        }

        const makeNextEvent = (nextEventId) => {
          if (currentGameId !== gameId) {
            lastEventId = 0;
            return process.nextTick(() => finished(`gameId changed: ${currentGameId} to ${gameId}`));
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
            if (currentGameId !== gameId) {
              return finished(`gameId changed: ${currentGameId} to ${gameId}`);
            }
            if (isPaused) {
              if (currentEventId > nextEventId) {
                nextEventId = currentEventId + 1;
              }
              return setTimeout(() => makeNextEvent(nextEventId), 200);
            }
            if ((!currentEventId && !nextEventId) || (currentEventId === nextEventId - 1)) {
              socketWrapper.emit(`board:${boardId}`, currentEvent);
              redis.rpush(`viewer:${gameHash}`, JSON.stringify(currentEvent));
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
    if (data === null) {
      return startGame(null, (err) => {
        if (err) {
          console.warn('Error clearing session:', err);
        }
      })
    }
    redis.del(`viewer:game:${teamId}:${data.gameId}`, (err) => {
      if (err) {
        return console.warn('Error deleting previous game events:', data.gameId, err);
      }
      socketWrapper.broadcast(`viewer:board:${boardId}:started`, {
        teamId: teamId,
        gameId: data.gameId,
        orientation: data.orientation,
        pairingIndex: data.pairingIndex
      });
      didJumpAround = false;
      startGame(data.gameId, (err) => {
        if (err) {
          console.warn('Error starting a game:', data.gameId, err);
        }
      })
    });
  }

  function updateGameId(data) {
    updatePairing(db, socketWrapper, teamId, data, (err) => {
      if (err) {
        return console.warn('Error updating pairings:', teamId, data, err);
      }
      socketWrapper.broadcast(`viewer:board:${boardId}:change`, {teamId: teamId, gameId: data.gameId});
      didJumpAround = false;
      startGame(data.gameId, (err) => {
        if (err) {
          console.warn('Error starting game after an update:', data.gameId, err);
        }
      });
    });
  }

  function gotoPosition(data) {
    if (!gameHash) {
      return;
    }
    redis.lindex(gameHash, data.id + 1, (err, result) => {
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
      redis.rpush(`viewer:${gameHash}`, JSON.stringify(returnResult));
    });
  }

  function drawShape(data) {
    if (!gameHash) {
      return;
    }
    redis.rpush(`viewer:${gameHash}`, JSON.stringify({
      type: 'draw',
      data: data
    }));
  }

  function updatePlayback(state) {
    if (!gameHash) {
      return;
    }
    isPaused = state;
  }

  socketWrapper.on(`board:${boardId}:start`, startSession);
  socketWrapper.on(`board:${boardId}:draw`, drawShape);
  socketWrapper.on(`board:${boardId}:update`, updateGameId);
  socketWrapper.on(`board:${boardId}:goto`, gotoPosition);
  socketWrapper.on(`board:${boardId}:pause`, updatePlayback);
  return () => {
    socketWrapper.off(`board:${boardId}:start`, startSession);
    socketWrapper.off(`board:${boardId}:draw`, drawShape);
    socketWrapper.off(`board:${boardId}:update`, updateGameId);
    socketWrapper.off(`board:${boardId}:goto`, gotoPosition);
    socketWrapper.off(`board:${boardId}:pause`, updatePlayback);
    startGame(null, () => {
    });
  };
}

module.exports = BoardInteractiveRoute;
