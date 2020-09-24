const ChessBoard = require('chess.js');

function BoardViewerRoute(db, redis, io, socket, teamId, boardId) {
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
    const gameHash = `viewer:game:${teamId}:${currentGameId}`;

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
            lastEventId = 0;
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

  function startSession(data) {
    console.log(`viewer:board:${boardId}:start`, teamId, data);
    startGame(data.gameId, 0, (err) => {
      if (err) {
        console.log(err);
      }
    })
  }

  function stopSession() {
    console.log(`viewer:board:${boardId}:stop`, teamId);
    currentGameId = null;
  }

  function readySession() {
    console.log(`viewer:board:${boardId}:ready`, teamId);
    if (currentGameId !== null) {
      return;
    }
    redis.get(`game:${teamId}:${boardId}:current`, (err, data) => {
      if (err || !data) {
        console.log('Error catching up or nothing to catch up to:', `game:${teamId}:${boardId}:current`, data, err);
        return;
      }
      redis.lrange(data, 0, -1, (err, eventList) => {
        if (err || !data) {
          console.log('Error catching up or nothing in the list to catch up to:', `game:${teamId}:${boardId}:current`, eventList, err);
          return;
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
          console.log('No events present, we are done', `game:${teamId}:${boardId}:current`);
          return;
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

        socket.emit(`viewer:board:${boardId}`, {
          type: 'goto',
          data: {
            fen: chessBoard.fen(),
            clock: lastClock,
            moveList: moveList,
            moving: lastMove.move === 'w' ? 'home' : 'away'
          }
        });

        startGame(currentGameId, lastEventId, (err) => {
          console.log(err);
        });
      });
    });
  }

  socket.on(`viewer:board:${boardId}:ready`, readySession);
  socket.on(`viewer:board:${boardId}:start`, startSession);
  socket.on(`viewer:board:${boardId}:stop`, stopSession);
  return () => {
    socket.off(`viewer:board:${boardId}:ready`, readySession);
    socket.off(`viewer:board:${boardId}:start`, startSession);
    socket.off(`viewer:board:${boardId}:stop`, stopSession);
    startGame(null, 0, () => {
    });
  };
}

module.exports = BoardViewerRoute;
