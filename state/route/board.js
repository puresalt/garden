const BoardEventRoute = require('./board/event');
const BoardInteractiveRoute = require('./board/interactive');
const BoardViewerRoute = require('./board/viewer');

function StreamerRoute(db, redis, io, socket, teamId) {
  function updateStreamState(data) {
    console.log('stream:update', teamId, data);
    redis.hset(`stream:${teamId}`, data.matchId, data.isLive ? '1' : '0', (err) => {
      if (err) {
        console.log('Failed updating stream state:', teamId, data, err);
        return;
      }
      console.log('stream:updated', teamId, data);
      socket.broadcast.emit('stream:updated', data);
    });
  }

  function loadStreamState(matchId) {
    console.log('stream:load', teamId, matchId);
    redis.hget(`stream:${teamId}`, matchId, (err, isLive) => {
      if (err) {
        console.log('Failed getting stream state:', teamId, matchId, err);
        return;
      }
      console.log('stream:loaded', teamId, isLive, {matchId: matchId, isLive: isLive === '1'});
      socket.emit('stream:loaded', {matchId: matchId, isLive: isLive === '1'});
    });
  }

  function listStreamState() {
    console.log('stream:list', teamId);
    redis.hgetall(`stream:${teamId}`, (err, data) => {
      if (err) {
        console.log('Failed getting stream list:', teamId, data, err);
        return;
      }
      const returnData = Object.keys(data).reduce((gathered, item) => {
        gathered[item] = data[item] === '1';
        return gathered;
      }, {});
      console.log('stream:listed', teamId, returnData);
      socket.emit('stream:listed', returnData);
    });
  }

  socket.on('streamer:update', updateStreamState);
  socket.on('streamer:load', loadStreamState);
  socket.on('streamer:list', listStreamState);
  const boardSubRoutes = [1, 2, 3, 4].reduce((gathered, i) => {
    gathered.push(
      BoardEventRoute(db, redis, io, socket, teamId, i),
      BoardInteractiveRoute(db, redis, io, socket, teamId, i),
      BoardViewerRoute(db, redis, io, socket, teamId, i)
    );
    return gathered;
  }, []);
  return () => {
    socket.off('streamer:update', updateStreamState);
    socket.off('streamer:load', loadStreamState);
    socket.off('streamer:list', listStreamState);
    boardSubRoutes.forEach(i => i());
  };
}

module.exports = StreamerRoute;
