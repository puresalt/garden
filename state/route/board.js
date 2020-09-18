function BoardRoute(io, socket) {
  socket.emit('board:1', {type: 'move', from: 'e2', to: 'e4'});
  setTimeout(_ => socket.emit('board:1', {type: 'movePiece', data: ['e2', 'e4']}), 100);
  setTimeout(_ => socket.emit('board:1', {type: 'movePiece', data: ['e7', 'e5']}), 200);
  setTimeout(_ => socket.emit('board:1', {type: 'movePiece', data: ['b1', 'c3']}), 300);
  setTimeout(_ => socket.emit('board:1', {type: 'movePiece', data: ['g8', 'f6']}), 500);
  setTimeout(_ => socket.emit('board:1', {type: 'drawArrow', data: [{orig: 'e2', dest: 'e4', brush: 'green'}]}), 700);
  setTimeout(_ => socket.emit('board:1', {
    type: 'drawArrow',
    data: [{orig: 'e2', dest: 'e4', brush: 'green'}, {orig: 'e7', dest: 'e5', brush: 'blue'}]
  }), 900);
  setTimeout(_ => socket.emit('board:1', {type: 'startBoard', data: {}}), 5000);
  return () => {
  };
}

module.exports = BoardRoute;
