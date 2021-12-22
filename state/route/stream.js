const BoardViewerRoute = require('./board/viewer');

function StreamerRoute(redis, socketWrapper) {
  const boardSubRoutes = [1, 2, 3, 4, 5, 6, 7, 8].reduce((gathered, i) => {
    gathered.push(
      BoardViewerRoute(redis, socketWrapper, i)
    );
    return gathered;
  }, []);

  return () => {
    boardSubRoutes.forEach(i => i());
  };
}

module.exports = StreamerRoute;
