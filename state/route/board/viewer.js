function BoardViewerRoute(db, redis, io, socket, teamId, boardId) {
  let currentGameId = null;
  let lastEventId = 0;
  const startGame = (gameId, finished) => {
    if (!gameId) {
      return process.nextTick(() => finished(`no gameId: ${gameId} (${typeof gameId})`));
    }
    currentGameId = gameId;
    const gameHash = `game:${teamId}:${currentGameId}:viewer`;

    const getGameEvents = () => {
      redis.lrange(gameHash, lastEventId, -1, (err, result) => {
        if (err) {
          console.log('Error getting events:', gameId);
          return;
        }

        const eventList = result.map(JSON.parse);
        if (!eventList.length) {
          return setTimeout(() => getGameEvents(), 250);
        }

        const makeNextEvent = (nextEventId) => {
          if (currentGameId !== gameId) {
            return process.nextTick(() => finished(`gameId changed: ${currentGameId} to ${gameId}`));
          }
          const currentEvent = eventList[nextEventId];
          if (!currentEvent) {
            return setTimeout(() => getGameEvents(), 250);
          }
          console.log(`viewer:board:${boardId}`, currentEvent);
          socket.emit(`viewer:board:${boardId}`, currentEvent);
          ++lastEventId;
          setTimeout(() => makeNextEvent(nextEventId + 1), 250);
        };
        makeNextEvent(0);
      });
    };
    getGameEvents();
  };

  function startSession(gameId) {
    console.log(`viewer:board:${boardId}:start`, teamId, gameId);
    startGame(gameId, (err) => {
      if (err) {
        console.log(err);
      }
    })
  }

  function stopSession() {
    console.log(`viewer:board:${boardId}:stop`, teamId);
    currentGameId = null;
  }

  console.log('connecting:', `viewer:board:${boardId}:start`);
  socket.on(`viewer:board:${boardId}:start`, startSession);
  socket.on(`viewer:board:${boardId}:stop`, stopSession);
  return () => {
    socket.off(`viewer:board:${boardId}:start`, startSession);
    socket.off(`viewer:board:${boardId}:stop`, stopSession);
  };
}

module.exports = BoardViewerRoute;
