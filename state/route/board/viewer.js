const ChessBoard = require('chess.js');

function BoardViewerRoute(db, redis, socketWrapper, boardId) {
  let currentGameId = null;
  let lastEventId = 0;
  const startGame = (gameId, newLastEventId, finished) => {
    if (!gameId) {
      lastEventId = 0;
      return process.nextTick(() => finished(`no gameId: ${gameId} (${typeof gameId})`));
    }
    if (newLastEventId) {
      lastEventId = newLastEventId;
    }
    currentGameId = gameId;
    const gameHash = `usate:viewer:game:${currentGameId}`;

    const getGameEvents = () => {
      redis.lrange(gameHash, lastEventId, -1, (err, result) => {
        if (err) {
          return console.error('Error getting events:',gameId);
        }

        const eventList = result.map(JSON.parse);
        if (!eventList.length) {
          return setTimeout(() => getGameEvents(), 250);
        }

        const makeNextEvent = (nextEventId) => {
          if (currentGameId !== gameId) {
            lastEventId = 0;
            return process.nextTick(() => finished(`gameId changed: ${currentGameId} to ${gameId}`));
          }
          const currentEvent = eventList[nextEventId];
          if (!currentEvent) {
            return setTimeout(() => getGameEvents(), 250);
          }
          socketWrapper.emit(`viewer:board:${boardId}`, currentEvent);
          ++lastEventId;
          setTimeout(() => makeNextEvent(nextEventId + 1), 250);
        };
        makeNextEvent(0);
      });
    };
    getGameEvents();
  };

  function startSession(data) {
    startGame(data.gameId, 0, (err) => {
      if (err) {
        console.warn('Error trying to start a new viewer session:', boardId, err);
      }
    })
  }

  function stopSession() {
    currentGameId = null;
  }

  function readySession() {
    if (currentGameId !== null) {
      return;
    }
    redis.get(`usate:game:${boardId}:current`, (err, data) => {
      if (err || !data) {
        return console.warn('Error catching up or nothing to catch up to:', boardId, data, err);
      }
      redis.lrange(data, 0, -1, (err, eventList) => {
        if (err || !data) {
          return console.warn('Error catching up or nothing in the list to catch up to:', boardId, eventList, err);
        }

        const lastEventId = eventList.length;
        const parsedEventList = [];
        let currentEventId;
        let currentEvent;
        let resultEvent;
        for (currentEventId = lastEventId; currentEventId > 0; --currentEventId) {
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
          return console.info('No events present, we are done', boardId);
        }

        const moveList = currentEvent.data.moveList;

        let lastMove = {move: 'w'};
        let lastClock = currentEvent.data.clock;
        const chessBoard = new ChessBoard(currentEvent.fen);
        for (let i = 0, count = parsedEventList.length; i < count; ++i) {
          lastMove = chessBoard.move(parsedEventList.data.pgn);
          if (lastMove && parsedEventList.data.id > moveList.length) {
            moveList.push(lastMove);
          }
          lastClock = parsedEventList.data.clock;
        }

        socketWrapper.emit(`viewer:board:${boardId}`, {
          type: 'goto',
          data: {
            fen: chessBoard.fen(),
            clock: lastClock,
            moveList: moveList,
            moving: lastMove.move === 'w' ? 'home' : 'away'
          }
        });

        startGame(currentGameId, lastEventId, (err) => {
          if (err) {
            console.warn('Error starting viewer game:',  boardId, err);
          }
          console.info('Finished viewing game:', boardId);
        });
      });
    });
  }

  socketWrapper.on(`viewer:board:${boardId}:ready`, readySession);
  socketWrapper.on(`viewer:board:${boardId}:start`, startSession);
  socketWrapper.on(`viewer:board:${boardId}:stop`, stopSession);
  return () => {
    socketWrapper.off(`viewer:board:${boardId}:ready`, readySession);
    socketWrapper.off(`viewer:board:${boardId}:start`, startSession);
    socketWrapper.off(`viewer:board:${boardId}:stop`, stopSession);
    startGame(null, 0, () => {
    });
  };
}

module.exports = BoardViewerRoute;
