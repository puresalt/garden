const STATE_LOOKUP = require('gcss-common/data/stateLookup.json');

const matchKeys = [
  ['opponent', 'opponent'],
  ['host_name', 'hostName'],
  ['host_instagram', 'hostInstagram'],
  ['host_twitch', 'hostTwitch'],
  ['host_twitter', 'hostTwitter']
];

function adminMatchRoute(dataStore, io, socket, teamId) {
  function existMatch(matchId) {
    dataStore.query('SELECT COUNT(*) AS count FROM `garden_match` WHERE team_id = ? AND id = ? LIMIT 1;', [teamId, matchId], (err, result) => {
      if (err) {
        console.error('Error checking for existence on:', teamId, matchId, err);
        socket.emit('match:exists', null);
        return;
      }
      const exists = Number(result[0].count) === 1;
      console.log('match:exists', teamId, matchId, exists);
      socket.emit('match:exists', exists);
    });
  }

  function createNewMatch(data) {
    const insertData = matchKeys.reduce((gathered, keys) => {
      gathered[keys[0]] = data[keys[1]] || null;
      return gathered;
    }, {});
    if (insertData.opponent && !STATE_LOOKUP[insertData.opponent]) {
      insertData.opponent = null;
    }
    insertData.team_id = teamId;
    dataStore.beginTransaction((err) => {
      if (err) {
        console.error('Error beginning create match transaction:', teamId, data, err);
        console.log('match:created', teamId, null);
        socket.emit('match:created', null);
        return;
      }
      dataStore.query('INSERT INTO garden_match SET ?', insertData, (err, result) => {
        if (err || !(result || {}).insertId) {
          return dataStore.rollback(() => {
            console.error('Error creating match:', teamId, data, result, err);
            console.log('match:created', teamId, null);
            socket.emit('match:created', null);
          });
        }
        console.log('match:created', teamId, {teamId: teamId, id: result.insertId, match: data});
        io.sockets.emit('match:created', {teamId: teamId, id: result.insertId, match: data});

        const matchId = result.insertId;
        dataStore.query('INSERT INTO garden_player (match_id) VALUES (?), (?), (?), (?);', [matchId, matchId, matchId, matchId], (err, playerInsertResult) => {
          console.log('RETURN:', playerInsertResult.insertId);
          if (err || !playerInsertResult.insertId) {
            return dataStore.rollback(() => {
              console.error('Error creating player list:', teamId, data, result, err);
              console.log('match:created', teamId, null);
              socket.emit('match:created', null);
            });
          }
          dataStore.query('INSERT INTO garden_opponent (match_id) VALUES (?), (?), (?), (?);', [matchId, matchId, matchId, matchId], (err, opponentInsertResult) => {
            if (err || !opponentInsertResult.insertId) {
              return dataStore.rollback(() => {
                console.error('Error creating opponent list:', teamId, data, result, err);
                console.log('match:created', teamId, null);
                socket.emit('match:created', null);
              });
            }
            dataStore.commit((err) => {
              if (err) {
                return dataStore.rollback(() => {
                  console.error('Error creating error committing:', teamId, data, result, err);
                  console.log('match:created', teamId, null);
                  socket.emit('match:created', null);
                });
              }
              const fillPlayerData = (start) => {
                const playerData = [];
                for (let i = 0; i < 4; ++i) {
                  playerData.push({id: start + i, matchId: matchId, name: null, lichessHandle: null, rating: null});
                }
                return playerData;
              };
              console.log('match:created', teamId, {teamId: teamId, id: result.insertId, match: data});
              io.sockets.emit('match:created', {teamId: teamId, id: result.insertId, match: data});
              const filledOpponentData = fillPlayerData(opponentInsertResult.insertId);
              console.log('opponent:listed', filledOpponentData);
              io.sockets.emit('opponent:listed', filledOpponentData);
              const filledPlayerData = fillPlayerData(playerInsertResult.insertId);
              console.log('player:listed', filledPlayerData);
              io.sockets.emit('player:listed', filledPlayerData);
            });
          });
        });
      });
    });
  }

  function updateMatch(data) {
    const updateData = matchKeys.reduce((gathered, keys) => {
      if (data[keys[1]] !== null && data[keys[1]] !== undefined) {
        gathered.push(keys[0], data[keys[1]]);
      }
      return gathered;
    }, []);
    if (updateData[0] === 'opponent' && !STATE_LOOKUP[updateData[1]]) {
      updateData.shift();
      updateData.shift();
    }
    const columnCount = updateData.length / 2;
    const columns = (new Array(columnCount)).fill('?? = ?', 0, columnCount).join(', ');
    updateData.push(teamId);
    updateData.push(data.id);
    console.log(updateData);
    dataStore.query(`UPDATE garden_match SET ${columns} WHERE team_id = ? AND id = ?;`, updateData, (err, result) => {
        if (err) {
          console.error('Error updating:', teamId, data, result, err);
          console.log('match:updated', teamId, null);
          socket.emit('match:updated', null);
          return;
        }
        if (result.changedRows) {
          const returnData = {teamId: teamId, ...data};
          console.log('match:updated', teamId, returnData);
          socket.broadcast.emit('match:updated', returnData);
        }
      }
    );
  }

  function deleteMatch(matchId) {
    console.log('match:delete', matchId);
    dataStore.query('UPDATE garden_match SET deleted = true WHERE team_id = ? AND id = ?;', [teamId, matchId], (err, result) => {
        if (err) {
          console.error('Error deleting:', matchId, err);
          console.log('match:deleted:ok', false);
          return;
        }
        if (result.changedRows) {
          console.log('match:deleted', teamId, matchId);
          socket.emit('match:deleted:ok', true);
          io.sockets.emit('match:deleted', matchId);
        }
      }
    );
  }

  function loadMatch(matchId) {
    console.log('match:load', matchId);
    const load = (err, result) => {
      if (err) {
        console.error('Error finding the latest matchId:', teamId, err);
        return;
      }
      if (!result.length) {
        console.log('match:loaded', teamId, {id: 0});
        socket.emit('match:loaded', {id: 0});
        return;
      }
      const returnData = matchKeys.reduce((gathered, keys) => {
        gathered[keys[1]] = result[0][keys[0]] || null;
        return gathered;
      }, {id: result[0].id});
      console.log('match:loaded', teamId, returnData);
      socket.emit('match:loaded', returnData);
    };

    const findLatestMatch = () => {
      dataStore.query('SELECT * FROM garden_match WHERE team_id = ? ORDER BY id DESC LIMIT 1;', teamId, load);
    };
    if (matchId === null) {
      findLatestMatch();
    } else {
      dataStore.query('SELECT * FROM garden_match WHERE team_id = ? AND id = ?;', [teamId, matchId], (err, result) => {
        if (err) {
          return load(err);
        }
        if (!result.length) {
          return findLatestMatch();
        }
        load(null, result);
      });
    }
  }

  function index() {
    console.log('match:list');
    dataStore.query('SELECT * FROM garden_match WHERE team_id = ?', [teamId], (err, result) => {
      if (err) {
        console.log('Error retrieving match list:', err);
        console.log('match:listed', []);
        socket.emit('match:listed', []);
        return;
      }
      const parsedData = result.map((item) => matchKeys.reduce((gathered, keys) => {
        gathered[keys[1]] = item[keys[0]] || null;
        return gathered;
      }, {id: item.id}));
      console.log('match:listed', parsedData);
      socket.emit('match:listed', parsedData);
    });
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

module.exports = adminMatchRoute;
