const _ = require('lodash');

let _storedData = [];

const cleanRecord = (item) => {
  item.rating = item.rating
    ? Number(item.rating)
    : 0;
  item.name = item.name || '';
  item.username = item.username || '';
  return item;
};

const ratingSort = (a, b) => {
  return a.rating < b.rating
    ? 1
    : (a.rating === b.rating
      ? 0
      : -1);
};

function AdminPlayerRoute(io, socket) {
  function updatePlayerList(data) {
    console.log('match:player:update', data);
    if (!data.id || (!data.player && !data.opponent)) {
      console.log('match:player:missing', data.id);
      socket.emit('match:player:missing', data.id);
      return;
    }
    const existed = !!_storedData[data.id - 1];
    if (!existed) {
      _storedData[data.id - 1] = {player: [], opponent: []};
    }

    if (data.player) {
      data.player = data.player.filter(item => item !== null).map(cleanRecord);
      data.player.sort(ratingSort);
      _storedData[data.id - 1].player = data.player;
    }
    if (data.opponent) {
      data.opponent = data.opponent.filter(item => item !== null).map(cleanRecord);
      data.opponent.sort(ratingSort);
      _storedData[data.id - 1].opponent = data.opponent;
    }

    const returnData = {new: !existed, ..._storedData[data.id - 1]};
    console.log('match:player:updated', returnData);
    io.sockets.emit('match:player:updated', returnData);
  }

  function getPlayerList(matchId) {
    console.log('match:player:list', matchId);
    if (!matchId) {
      console.log('match:player:missing', matchId);
      socket.emit('match:player:missing', matchId);
      return;
    }
    const returnData = {id: matchId, ...(_storedData[matchId - 1] || {player: [], opponent: []})};
    console.log('match:player:listed', returnData);
    socket.emit('match:player:listed', returnData);
  }

  socket.on('match:player:update', updatePlayerList);
  socket.on('match:player:list', getPlayerList);

  return () => {
    socket.on('match:player:update', updatePlayerList);
    socket.on('match:player:list', getPlayerList);
  };
}

module.exports = AdminPlayerRoute;
