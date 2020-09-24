const updatePairing = require('../pairing').updatePairing;

function BoardInteractiveRoute(db, redis, io, socket, teamId, boardId) {
  let currentGameId = null;
  let currentEventId = 0;
  let isPaused = false;
  let gameHash = null;
  let didJumpAround = false;
  const startGame = (gameId, finished) => {
    if (!gameId) {
      socket.emit(`board:${boardId}`, {
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
        console.warn('Could not set current gameId:', teamId, boardId, currentGameId, err);
        return;
      }
      console.log(`Set game:${teamId}:${boardId}:current to`, currentGameId);
    });
    let eventList = [];
    const getGameEvents = (lastEventId) => {
      redis.lrange(gameHash, lastEventId, -1, (err, result) => {
        if (err) {
          console.log('Error getting events:', gameId);
          return;
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
              console.log(`board:${boardId}`, currentEvent);
              socket.emit(`board:${boardId}`, currentEvent);
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
    console.log(`board:${boardId}:start`, teamId, data);
    if (data === null) {
      return startGame(null, (err) => {
        console.log('Error starting session:', err);
      })
    }
    redis.del(`viewer:game:${teamId}:${data.gameId}`, (err) => {
      if (err) {
        return console.log(err);
      }
      console.log(`viewer:board:${boardId}:started`, {
        gameId: data.gameId,
        orientation: data.orientation,
        pairingIndex: data.pairingIndex
      });
      socket.broadcast.emit(`viewer:board:${boardId}:started`, {
        gameId: data.gameId,
        orientation: data.orientation,
        pairingIndex: data.pairingIndex
      });
      didJumpAround = false;
      startGame(data.gameId, (err) => {
        if (err) {
          console.log(err);
        }
      })
    });
  }

  function updateGameId(data) {
    console.log(`board:${boardId}:update`, teamId, gameHash, data);
    updatePairing(db, io, socket, teamId, data, (err) => {
      if (err) {
        return;
      }
      socket.broadcast.emit(`viewer:board:${boardId}:change`, data.gameId);
      didJumpAround = false;
      startGame(data.gameId, (err) => {
        if (err) {
          console.log(err);
        }
      });
    });
  }

  function gotoPosition(data) {
    console.log(`board:${boardId}:goto`, teamId, gameHash, data);
    if (!gameHash) {
      return;
    }
    redis.lindex(gameHash, data.id + 1, (err, result) => {
      if (err || !result) {
        console.log('Error going to position:', err);
        return;
      }
      if (err || !result) {
        console.log('Error adding goto:', err);
        return;
      }
      didJumpAround = !data.stopJumping;
      isPaused = data.paused;
      currentEventId = data.id;
      const returnResult = JSON.parse(result);
      returnResult.type = 'goto';
      console.log(`board:${boardId}`, JSON.stringify(returnResult));
      socket.emit(`board:${boardId}`, returnResult);
      redis.rpush(`viewer:${gameHash}`, JSON.stringify(returnResult));
    });
  }

  function drawShape(data) {
    console.log(`board:${boardId}:draw`, teamId, gameHash, data);
    if (!gameHash) {
      return;
    }
    redis.rpush(`viewer:${gameHash}`, JSON.stringify({
      type: 'draw',
      data: data
    }));
  }

  function updatePlayback(state) {
    console.log(`board:${boardId}:pause`, teamId, gameHash, state);
    if (!gameHash) {
      return;
    }
    isPaused = state;
  }

  socket.on(`board:${boardId}:start`, startSession);
  socket.on(`board:${boardId}:draw`, drawShape);
  socket.on(`board:${boardId}:update`, updateGameId);
  socket.on(`board:${boardId}:goto`, gotoPosition);
  socket.on(`board:${boardId}:pause`, updatePlayback);
  return () => {
    socket.off(`board:${boardId}:start`, startSession);
    socket.off(`board:${boardId}:draw`, drawShape);
    socket.off(`board:${boardId}:gameId`, updateGameId);
    socket.off(`board:${boardId}:goto`, gotoPosition);
    socket.off(`board:${boardId}:pause`, updatePlayback);
    startGame(null, () => {
    });
  };
}

module.exports = BoardInteractiveRoute;
