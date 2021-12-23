const PLAYERS = require('garden-common/src/constant').PLAYERS;

function Broadcaster(redis, broadcastAll, boardId) {
  const gameHash = `rapid:viewer:board:${boardId}`;

  let home = null;
  let away = null;
  const checkForNameChanges = () => {
    redis.get(`${gameHash}:home`, (name) => {
      if (name !== home) {
        home = name;
        broadcastAll(`${gameHash}:home`, PLAYERS[home]);
      }
    });
    redis.get(`${gameHash}:away`, (name) => {
      if (name !== away) {
        away = name;
        broadcastAll(`${gameHash}:away`, PLAYERS[away]);
      }
    });
  };

  let closed = false;
  let viewing = false;
  let checking = false;
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
      redis.lrange(gameHash, lastEventId, -1, (err, result) => {
        if (err) {
          return finished(err);
        }
        const currentEvent = JSON.parse(result[result.length - 1] || 'false');
        if (currentEvent) {
          broadcastAll(gameHash, currentEvent);
          lastEventId = lastEventId + result.length;
        }
        checkForNameChanges();
        return setTimeout(() => getGameEvents(), 60);
      });
    };
    getGameEvents();
  };

  broadcastAll(gameHash, {
    type: 'goto',
    data: {
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      clock: [900, 900],
      moveList: [],
      moving: 'home'
    }
  });

  const checkForStatus = () => {
    checking = true;
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
          checking = false;
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

  checkForNameChanges();
  checkForStatus();
}

module.exports = Broadcaster;
