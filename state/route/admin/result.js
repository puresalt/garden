const _ = require('lodash');

let _storedData = [];

function getPlayerListData(matchId) {
  return _storedData[matchId - 1];
}

function AdminRoute(io, socket) {
  function updatePlayerList(data) {
    console.log('match:player:update', data);
    if (!data.id || !data.players || !data.opponents) {
      console.log('match:player:missing', data.id);
      socket.emit('match:player:missing', data.id);
      return;
    }
    let currentData = getPlayerListData(data.id);
    data.players.sort();
    data.opponents.sort();
    _storedData[data.id - 1] = data.list;
    console.log('match:player:updated', currentMatchId, {id: currentMatchId, data: _storedData[currentMatchId - 1]});
    io.sockets.emit('match:player:updated', {id: currentMatchId, data: _storedData[currentMatchId - 1]});
  }

  socket.on('match:player:update', updatePlayerList);
  socket.on('match:player:list', getPlayerList);

  return () => {
    socket.on('match:player:update', updatePlayerList);
    socket.on('match:player:list', getPlayerList);
  };
}

module.exports = AdminRoute;
