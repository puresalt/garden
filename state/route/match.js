const STATE_LOOKUP = require('garden-common/data/stateLookup.json');

const matchKeys = [
  ['opponent', 'opponent'],
  ['host_name', 'hostName'],
  ['host_instagram', 'hostInstagram'],
  ['host_twitch', 'hostTwitch'],
  ['host_twitter', 'hostTwitter'],
  ['home', 'isHome'],
  ['show_webcam', 'showWebcam'],
  ['show_ad_unit', 'showAdUnit'],
  ['show_programmatic_boards', 'showProgrammaticBoards'],
  ['show_debug_information', 'showDebugInformation']
];
const booleanKeys = [
  'host_instagram',
  'host_twitch',
  'host_twitter',
  'home',
  'show_webcam',
  'show_ad_unit',
  'show_programmatic_boards',
  'show_debug_information'
];

function matchRoute(db, redis, socketWrapper, teamId) {
  function existMatch(matchId) {
    db.query('SELECT COUNT(*) AS count FROM `garden_match` WHERE team_id = ? AND id = ? LIMIT 1;', [teamId, matchId], (err, result) => {
      if (err) {
        console.error('Error checking for existence on:', teamId, matchId, err);
        socketWrapper.emit('match:exists', null);
        return;
      }
      const exists = Number(result[0].count) === 1;
      socketWrapper.emit('match:exists', exists);
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
    db.beginTransaction((err) => {
      if (err) {
        console.error('Error beginning create match transaction:', teamId, data, err);
        socketWrapper.emit('match:created', null);
        return;
      }
      db.query('INSERT INTO garden_match SET ?;', insertData, (err, result) => {
        if (err || !(result || {}).insertId) {
          return db.rollback(() => {
            console.error('Error creating match:', teamId, data, result, err);
            socketWrapper.emit('match:created', null);
          });
        }
        socketWrapper.broadcastAll('match:created', {teamId: teamId, id: result.insertId, match: data});

        const matchId = result.insertId;
        db.query('INSERT INTO garden_player (match_id) VALUES (?), (?), (?), (?);', [matchId, matchId, matchId, matchId], (err, playerInsertResult) => {
          if (err || !playerInsertResult.insertId) {
            return db.rollback(() => {
              console.error('Error creating player list:', teamId, data, result, err);
              socketWrapper.emit('match:created', null);
            });
          }
          db.query('INSERT INTO garden_opponent (match_id) VALUES (?), (?), (?), (?);', [matchId, matchId, matchId, matchId], (err, opponentInsertResult) => {
            if (err || !opponentInsertResult.insertId) {
              return db.rollback(() => {
                console.error('Error creating opponent list:', teamId, data, result, err);
                socketWrapper.emit('match:created', null);
              });
            }
            db.commit((err) => {
              if (err) {
                return db.rollback(() => {
                  console.error('Error creating error committing:', teamId, data, result, err);
                  socketWrapper.emit('match:created', null);
                });
              }
              const fillPlayerData = (start) => {
                const playerData = [];
                for (let i = 0; i < 4; ++i) {
                  playerData.push({id: start + i, matchId: matchId, name: null, lichessHandle: null, rating: null});
                }
                return playerData;
              };
              socketWrapper.broadcastAll('match:created', {teamId: teamId, id: result.insertId, match: data});
              const filledOpponentData = fillPlayerData(opponentInsertResult.insertId);
              socketWrapper.broadcastAll('opponent:listed', {
                teamId: teamId,
                matchId: result.insertId,
                players: filledOpponentData
              });
              const filledPlayerData = fillPlayerData(playerInsertResult.insertId);
              socketWrapper.broadcastAll('player:listed', {teamId: teamId, players: filledPlayerData});
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
    db.query(`UPDATE garden_match SET ${columns} WHERE team_id = ? AND id = ?;`, updateData, (err, result) => {
        if (err) {
          console.error('Error updating:', teamId, data, result, err);
          socketWrapper.emit('match:updated', null);
          return;
        }
        if (result.changedRows) {
          socketWrapper.broadcast('match:updated', {teamId: teamId, ...data});
        }
      }
    );
  }

  function deleteMatch(matchId) {
    db.query('UPDATE garden_match SET deleted = true WHERE team_id = ? AND id = ?;', [teamId, matchId], (err, result) => {
        if (err) {
          return console.error('Error deleting:', matchId, err);
        }
        if (result.changedRows) {
          socketWrapper.broadcastAll('match:deleted', {teamId: teamId, id: matchId});
        }
      }
    );
  }

  function loadMatch(matchId) {
    const load = (err, result) => {
      if (err) {
        return console.error('Error finding the latest matchId:', teamId, err);
      }
      if (!result.length) {
        socketWrapper.emit('match:loaded', {id: 0});
        return;
      }
      const returnData = matchKeys.reduce((gathered, keys) => {
        gathered[keys[1]] = result[0][keys[0]];
        if (gathered[keys[1]] !== null && booleanKeys.indexOf(keys[0]) > -1) {
          gathered[keys[1]] = gathered[keys[1]] === 1;
        }
        return gathered;
      }, {teamId: teamId, id: parseInt(result[0].id)});
      socketWrapper.emit('match:loaded', returnData);
    };

    const findLatestMatch = () => {
      db.query('SELECT * FROM garden_match WHERE team_id = ? ORDER BY id DESC LIMIT 1;', teamId, load);
    };
    if (matchId === null) {
      findLatestMatch();
    } else {
      db.query('SELECT * FROM garden_match WHERE team_id = ? AND id = ? AND deleted = false;', [teamId, matchId], (err, result) => {
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
    db.query('SELECT * FROM garden_match WHERE team_id = ?;', [teamId], (err, result) => {
      if (err) {
        console.warn('Error retrieving match list:', err);
        socketWrapper.emit('match:listed', []);
        return;
      }
      const parsedData = result.map((item) => matchKeys.reduce((gathered, keys) => {
        gathered[keys[1]] = item[keys[0]] || null;
        return gathered;
      }, {id: parseInt(item.id)}));
      socketWrapper.emit('match:listed', parsedData);
    });
  }

  socketWrapper.on('match:create', createNewMatch);
  socketWrapper.on('match:update', updateMatch);
  socketWrapper.on('match:delete', deleteMatch);
  socketWrapper.on('match:load', loadMatch);
  socketWrapper.on('match:exist', existMatch);
  socketWrapper.on('match:list', index);
  return () => {
    socketWrapper.off('match:create', createNewMatch);
    socketWrapper.off('match:update', updateMatch);
    socketWrapper.off('match:delete', deleteMatch);
    socketWrapper.off('match:load', loadMatch);
    socketWrapper.off('match:exist', existMatch);
    socketWrapper.off('match:list', index);
  };
}

module.exports = matchRoute;
