const BoardViewerRoute = require('./board/viewer');
const StreamUtility = require('../src/stream');

function StreamerRoute(db, redis, socketWrapper) {
  const streamUtility = StreamUtility(redis);
  let lastState = {};
  let stopLooping = false;

  function updateStreamState(isLive) {
    streamUtility.setState({isLive}, (err, data) => {
      if (err) {
        return console.warn('Failed updating stream state:', isLive, err);
      }
      socketWrapper.broadcast('stream:loaded', data);
    })
  }

  function loadStreamState() {
    stopLooping = false;

    const loopForStateChanges = () => {
      if (stopLooping) {
        return;
      }
      streamUtility.getState((err, data) => {
        if (err) {
          return console.warn('Failed getting stream state:', err);
        }
        if (!data) {
          return setTimeout(loopForStateChanges, 250);
        }
        if (
          lastState.isLive === undefined
          || lastState.gameId === undefined || lastState.gameId !== data.gameId
          || lastState.examineId === undefined || lastState.examineId !== data.examineId
          || lastState.matchId === undefined || lastState.matchId !== data.matchId
        ) {
          lastState = data;
          socketWrapper.emit('stream:loaded', lastState);
        }
        setTimeout(loopForStateChanges, 250);
      });
    };
    loopForStateChanges();
  }

  socketWrapper.on('stream:update', updateStreamState);
  socketWrapper.on('stream:load', loadStreamState);
  const boardSubRoutes = [1, 2, 3, 4, 5, 6, 7, 8].reduce((gathered, i) => {
    gathered.push(
      BoardViewerRoute(db, redis, socketWrapper, i)
    );
    return gathered;
  }, []);
  return () => {
    stopLooping = true;
    socketWrapper.off('stream:update', updateStreamState);
    socketWrapper.off('stream:load', loadStreamState);
    boardSubRoutes.forEach(i => i());
  };
}

module.exports = StreamerRoute;
