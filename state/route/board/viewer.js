function BoardViewerRoute(db, redis, socketWrapper, boardId) {
  const gameHash = `college:viewer:game:${boardId}`;

  let closed = false;
  let viewing = false;
  let lastEventId = 0;
  const startGame = (newLastEventId, finished) => {
    if (newLastEventId !== null) {
      lastEventId = newLastEventId;
    }
    viewing = true;
    const getGameEvents = () => {
      if (closed) {
        return finished('Closed');
      }
      redis.get(`college:viewer:game:${boardId}:id`, (err) => {
        if (err) {
          return finished(err);
        }
        redis.lrange(gameHash, lastEventId, -1, (err, result) => {
          if (err) {
            return finished(err);
          }

          const eventList = result.map(JSON.parse);
          if (!eventList.length) {
            return setTimeout(() => getGameEvents(), 60);
          }

          const makeNextEvent = (nextEventId) => {
            if (closed) {
              return finished('Closed');
            }
            const currentEvent = eventList[nextEventId];
            if (!currentEvent) {
              return setTimeout(() => getGameEvents(), 60);
            }
            socketWrapper.emit(`viewer:board:${boardId}`, currentEvent);
            ++lastEventId;
            setTimeout(() => makeNextEvent(nextEventId + 1), 60);
          };
          makeNextEvent(0);
        });
      });
    };
    getGameEvents();
  };

  function stopSession() {
    closed = false;
  }

  function readySession() {
    if (viewing || closed) {
      return;
    }
    socketWrapper.emit(`viewer:board:${boardId}`, {
      type: 'goto',
      data: {
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        clock: [1500, 1500],
        moveList: [],
        moving: 'home'
      }
    });
    const checkForStatus = () => {
      redis.lrange(gameHash, 0, -1, (err, eventList) => {
        if (err) {
          return console.warn('Error catching up or nothing in the list to catch up to:', boardId, eventList, err);
        }

        lastEventId = eventList.length;
        let currentEventId;
        let currentEvent;
        let resultEvent;
        for (currentEventId = lastEventId - 1; currentEventId > 0; --currentEventId) {
          currentEvent = JSON.parse(eventList[currentEventId]);
          if (currentEvent && currentEvent.type) {
            if (currentEvent.type === 'goto' || currentEvent.type === 'start') {
              break;
            } else if (currentEvent.type === 'result') {
              resultEvent = currentEvent;
            }
          }
        }

        if (!currentEvent || !currentEvent.data || !currentEvent.data.fen) {
          return setTimeout(checkForStatus, 1000);
        }

        const loop = (err) => {
          if (err === 'Closed') {
            return;
          }
          if (err) {
            console.warn('Error starting viewer game:', boardId, err);
          }
          viewing = false;
          setTimeout(() => startGame(null, loop), 1000);
        };
        startGame(currentEventId, loop);
      });
    };
    checkForStatus();
  }

  socketWrapper.on(`viewer:board:${boardId}:start`, readySession);
  socketWrapper.on(`viewer:board:${boardId}:stop`, stopSession);
  return () => {
    closed = true;
    socketWrapper.off(`viewer:board:${boardId}:start`, readySession);
    socketWrapper.off(`viewer:board:${boardId}:stop`, stopSession);
  };
}

module.exports = BoardViewerRoute;
