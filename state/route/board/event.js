function BoardEventRoute(db, redis, io, socket, teamId, boardId) {
 
  function readySession() {
    console.log(`board:event:${boardId}:ready`);
  }
  
  socket.on(`board:event:${boardId}:ready`, readySession);
  return () => {
    socket.on(`viewer:event:${boardId}:ready`, readySession);
  };
}

module.exports = BoardEventRoute;
