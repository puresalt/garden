const _ = require('lodash');

let _storedData = [];

function getMatchData(matchId) {
  return _storedData[matchId - 1];
}

function AdminRoute(io, socket) {
  let currentMatchId = _storedData.length;

  function existMatch(matchId) {
    console.log('match:exist', matchId);
    const exists = !!getMatchData(matchId);
    console.log('match:exists', matchId, {id: matchId, exists: exists});
    socket.emit('match:exists', {id: matchId, exists: exists});
  }

  function createNewMatch(data) {
    console.log('match:create', data);
    _storedData.push(data);
    currentMatchId = _storedData.length;
    const returnData = {id: currentMatchId, ...getMatchData(currentMatchId)};
    console.log('match:created', currentMatchId, returnData);
    io.sockets.emit('match:created', returnData);
  }

  function updateMatch(data) {
    console.log('match:update', currentMatchId, data);
    const currentData = getMatchData(currentMatchId);
    if (!currentData) {
      console.log('match:missing', currentMatchId);
      socket.emit('match:missing', currentMatchId);
      currentMatchId = 0;
      return;
    }
    _storedData[currentMatchId - 1] = _.defaultsDeep(data, currentData);
    console.log('match:updated', currentMatchId, {id: currentMatchId, data: _storedData[currentMatchId - 1]});
    socket.broadcast.emit('match:updated', {id: currentMatchId, data: _storedData[currentMatchId - 1]});
  }

  function deleteMatch(matchId) {
    console.log('match:delete', matchId, matchId === currentMatchId);
    _storedData[matchId - 1] = false;
    if (matchId === currentMatchId) {
      currentMatchId = 0;
    }
    console.log('match:deleted', matchId, _storedData);
    io.sockets.emit('match:deleted', matchId);
  }

  function loadMatch(matchId) {
    console.log('match:load', matchId);
    const currentData = getMatchData(matchId);
    currentMatchId = currentData
      ? matchId
      : 0;
    const returnData = {id: currentMatchId, ...currentData};
    console.log('match:loaded', matchId, returnData);
    socket.emit('match:loaded', returnData);
  }

  function index() {
    console.log('match:list');
    const matches = _storedData.map((item, i) => {
      return item
        ? {
          id: i + 1,
          ...item
        }
        : false;
    }).filter(item => item !== false);
    console.log('match:listed', matches);
    socket.emit('match:listed', matches);
  }

  socket.on('match:create', createNewMatch);
  socket.on('match:update', updateMatch);
  socket.on('match:delete', deleteMatch);
  socket.on('match:load', loadMatch);
  socket.on('match:exist', existMatch);
  socket.on('match:list', index);

  return () => {
    socket.off('match:create', createNewMatch);
    socket.off('match:update', updateMatch);
    socket.off('match:delete', deleteMatch);
    socket.off('match:load', loadMatch);
    socket.off('match:exist', existMatch);
    socket.off('match:list', index);
  };
}

module.exports = AdminRoute;
