function BoardEventRoute(db, redis, socketWrapper, teamId, boardId) {

  function readySession() {
    // @TODO(JM): Add looping for new board updates via Redis. Similar to `stream:load(matchId)`.
  }

  socketWrapper.on(`board:event:${boardId}:ready`, readySession);
  return () => {
    socketWrapper.off(`board:event:${boardId}:ready`, readySession);
  };
}

module.exports = BoardEventRoute;
