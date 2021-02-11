const BoardEventRoute = require('./board/event');
const BoardInteractiveRoute = require('./board/interactive');
const BoardViewerRoute = require('./board/viewer');

function StreamerRoute(db, redis, socketWrapper) {
  function updateStreamState(isLive) {
    redis.hset('usate:stream:state', 'isLive', isLive ? '1' : '0', (err) => {
      if (err) {
        return console.warn('Failed updating stream state:', isLive, err);
      }
      socketWrapper.broadcast('stream:updated', isLive);
    });
  }

  function loadStreamState() {
    let lastState = {
      isLive: undefined,
      pairingId: undefined,
      boardNumber: undefined,
      home: undefined,
      away: undefined
    };
    const loopForStateChanges = () => {
      redis.hgetall('usate:stream:state', (err, data) => {
        if (err) {
          return console.warn('Failed getting stream state:', err);
        }
        if (!data) {
          return setTimeout(loopForStateChanges, 250);
        }
        const isLive = data.isLive === '1';
        const pairingId = data.pairingId ? parseInt(data.pairingId) : null;
        const boardNumber = data.boardNumber ? parseInt(data.boardNumber) : null;
        const home = data.home ? data.home : null;
        const away = data.away ? data.away : null;
        if (
          lastState.isLive === undefined
          || lastState.boardNumber === undefined
          || lastState.pairingId === undefined
          || lastState.away === undefined
          || lastState.home === undefined
          || lastState.isLive !== isLive
          || lastState.boardNumber !== boardNumber
          || lastState.pairingId !== pairingId
          || lastState.home !== home
          || lastState.away !== away
        ) {
          lastState.isLive = isLive;
          lastState.pairingId = pairingId;
          lastState.boardNumber = boardNumber;
          lastState.boardNumber = boardNumber;
          lastState.home = home;
          lastState.away = away;
          socketWrapper.emit('stream:loaded', lastState);
        }
        setTimeout(loopForStateChanges, 250);
      });
    };
    loopForStateChanges();
  }

  function listBoards() {
    redis.hgetall('usate:stream:board', (err, data) => {
      if (err) {
        return console.warn('Failed getting live stream board status:', data, err);
      }

      const parsePairing = (board) => {
        const parsePlayer = (team) => {
          return {
            name: data[`${board}:${team}:name`],
            handle: data[`${board}:${team}:handle`],
            rating: data[`${board}:${team}:rating`] ? parseInt(data[`${board}:${team}:rating`]) : null
          }
        };
        return {
          board: board,
          home: parsePlayer('home'),
          away: parsePlayer('away')
        };
      };
      const boardList = [
        parsePairing(1),
        parsePairing(2),
        parsePairing(3),
        parsePairing(4)
      ];

      socketWrapper.emit('stream:board:listed', boardList);
    });
  }

  socketWrapper.on('stream:update', updateStreamState);
  socketWrapper.on('stream:load', loadStreamState);
  socketWrapper.on('stream:board:list', listBoards);
  const boardSubRoutes = [1, 2, 3, 4].reduce((gathered, i) => {
    gathered.push(
      BoardEventRoute(db, redis, socketWrapper, i),
      BoardInteractiveRoute(db, redis, socketWrapper, i),
      BoardViewerRoute(db, redis, socketWrapper, i)
    );
    return gathered;
  }, []);
  return () => {
    socketWrapper.off('stream:update', updateStreamState);
    socketWrapper.off('stream:load', loadStreamState);
    socketWrapper.off('stream:board:list', listBoards);
    boardSubRoutes.forEach(i => i());
  };
}

module.exports = StreamerRoute;
