const BoardEventRoute = require('./board/event');
const BoardInteractiveRoute = require('./board/interactive');
const BoardViewerRoute = require('./board/viewer');

function StreamerRoute(db, redis, socketWrapper, teamId) {
  let streamStateId = null;

  function updateStreamState(data) {
    redis.hset(`stream:${teamId}`, data.matchId, data.isLive ? '1' : '0', (err) => {
      if (err) {
        return console.warn('Failed updating stream state:', teamId, data, err);
      }
      socketWrapper.broadcast('stream:updated', {teamId: teamId, ...data});
    });
  }

  function loadStreamState(matchId) {
    if (!matchId || streamStateId === matchId) {
      return;
    }
    streamStateId = matchId;
    let lastState = {
      teamId: teamId,
      matchId: matchId,
      isLive: undefined,
      boardNumber: undefined
    };
    const loopForStateChanges = () => {
      redis.hgetall(`stream:${teamId}:${matchId}`, (err, data) => {
        if (err) {
          return console.warn('Failed getting stream state:', teamId, matchId, err);
        }
        if (matchId !== streamStateId) {
          return;
        }
        if (!data) {
          return setTimeout(loopForStateChanges, 250);
        }
        const isLive = data.isLive === '1';
        const boardNumber = data.boardNumber ? parseInt(data.boardNumber) : null;
        if (lastState.isLive === undefined || lastState.boardNumber === undefined || lastState.isLive !== isLive || lastState.boardNumber !== boardNumber) {
          lastState.isLive = isLive;
          lastState.boardNumber = boardNumber;
          socketWrapper.emit('stream:loaded', lastState);
        }
        setTimeout(loopForStateChanges, 250);
      });
    };
    loopForStateChanges();
  }

  function listStreamState() {
    redis.hgetall(`stream:${teamId}`, (err, data) => {
      if (err) {
        return console.warn('Failed getting stream list:', teamId, data, err);
      }
      const returnData = Object.keys(data).reduce((gathered, item) => {
        gathered[item] = data[item] === '1';
        return gathered;
      }, {teamId: teamId});
      socketWrapper.emit('stream:listed', returnData);
    });
  }

  socketWrapper.on('stream:update', updateStreamState);
  socketWrapper.on('stream:load', loadStreamState);
  socketWrapper.on('stream:list', listStreamState);
  const boardSubRoutes = [1, 2, 3, 4].reduce((gathered, i) => {
    gathered.push(
      BoardEventRoute(db, redis, socketWrapper, teamId, i),
      BoardInteractiveRoute(db, redis, socketWrapper, teamId, i),
      BoardViewerRoute(db, redis, socketWrapper, teamId, i)
    );
    return gathered;
  }, []);
  return () => {
    socketWrapper.off('stream:update', updateStreamState);
    socketWrapper.off('stream:load', loadStreamState);
    socketWrapper.off('stream:list', listStreamState);
    boardSubRoutes.forEach(i => i());
  };
}

module.exports = StreamerRoute;
