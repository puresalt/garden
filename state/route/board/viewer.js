const ChessBoard = require('chess.js').Chess;

function BoardViewerRoute(db, redis, socketWrapper, boardId) {
  const gameHash = `usate:viewer:game:${boardId}`;

  let closed = false;
  let viewing = false;
  let lastEventId = 0;
  let currentGameId = 0;
  const startGame = (newLastEventId, finished) => {
    if (newLastEventId) {
      lastEventId = newLastEventId;
    }
    viewing = true;
    const getGameEvents = () => {
      if (closed) {
        return;
      }
      redis.get(`usate:viewer:game:${boardId}:id`, (err, gameId) => {
        if (!currentGameId) {
          currentGameId = gameId;
        }
        if (err || !gameId || gameId !== currentGameId) {
          return finished(err);
        }
        redis.lrange(gameHash, lastEventId, -1, (err, result) => {
          if (err) {
            return console.error('Error getting events:', boardId, err);
          }

          const eventList = result.map(JSON.parse);
          if (!eventList.length) {
            return setTimeout(() => getGameEvents(), 250);
          }

          const makeNextEvent = (nextEventId) => {
            const currentEvent = eventList[nextEventId];
            if (!currentEvent) {
              return setTimeout(() => getGameEvents(), 250);
            }
            socketWrapper.emit(`viewer:board:${boardId}`, currentEvent);
            ++lastEventId;
            process.nextTick(() => makeNextEvent(nextEventId + 1));
          };
          makeNextEvent(0);
        });
      });
    };
    getGameEvents();
  };

  function stopSession() {
    viewing = false;
  }

  function readySession(notFirstRun) {
    if (viewing) {
      return;
    }
    socketWrapper.emit(`viewer:board:${boardId}`, {
      type: 'goto',
      data: {
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        clock: [3600, 3600],
        moveList: [],
        moving: 'home'
      }
    });
    if (notFirstRun) {
      return startGame(0, (err) => {
        if (err) {
          console.warn('Error starting viewer game:', boardId, err);
        }
        currentGameId = 0;
        lastEventId = 0;
        viewing = false;
        setTimeout(() => readySession(true), 1000);
      });
    }
    redis.lrange(gameHash, 0, -1, (err, eventList) => {
      if (err) {
        return console.warn('Error catching up or nothing in the list to catch up to:', boardId, eventList, err);
      }

      lastEventId = eventList.length;
      const parsedEventList = [];
      let currentEventId;
      let currentEvent;
      let resultEvent;
      for (currentEventId = lastEventId - 1; currentEventId > 0; --currentEventId) {
        currentEvent = JSON.parse(eventList[currentEventId]);
        if (currentEvent && currentEvent.type) {
          if (currentEvent.type === 'goto' || currentEvent.type === 'start') {
            break;
          } else if (currentEvent.type === 'move') {
            parsedEventList.unshift(currentEvent);
          } else if (currentEvent.type === 'result') {
            resultEvent = currentEvent;
          }
        }
      }

      if (!currentEvent || !currentEvent.data || !currentEvent.data.fen) {
        return setTimeout(readySession, 1000);
      }

      const moveList = currentEvent.data.moveList || [];

      let lastMove = null;
      let lastClock = currentEvent.data.clock;
      const chessBoard = new ChessBoard(currentEvent.fen);
      for (let i = 0, count = parsedEventList.length; i < count; ++i) {
        lastMove = chessBoard.move(parsedEventList[i].data.pgn);
        if (lastMove && parsedEventList[i].data.id > moveList.length) {
          moveList.push(lastMove.san);
        } else {
        }
        lastClock = parsedEventList[i].data.clock;
      }
      if (lastMove) {
        socketWrapper.emit(`viewer:board:${boardId}`, {
          type: 'goto',
          data: {
            fen: chessBoard.fen(),
            clock: lastClock,
            moveList: moveList,
            moving: lastMove.move === 'w' ? 'home' : 'away'
          }
        });
      }

      startGame(currentEventId, (err) => {
        if (err) {
          console.warn('Error starting viewer game:', boardId, err);
        }
        currentGameId = 0;
        lastEventId = 0;
        viewing = false;
        setTimeout(() => readySession(true), 1000);
      });
    });
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
