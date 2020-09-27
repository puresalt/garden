const state = require('../src/state');

const sanitize = (item) => {
  item.id = item.id !== null ? Number(item.id) : null;
  item.rating = item.rating !== null ? Number(item.rating) : null;
  item.name = item.name || null;
  item.lichessHandle = item.lichessHandle || null;
  return item;
};

const sanitizePlayerList = (gathered, item) => {
  if (item.id) {
    gathered.push(item.name || '', item.lichessHandle || '', item.rating !== null ? Number(item.rating) : null, item.id);
  }
  return gathered;
};

function playerRoute(db, redis, socketWrapper, teamId) {
  function updateMemberList(data) {
    const members = data.map(sanitize);
    const values = members.reduce(sanitizePlayerList, []);
    const countToSave = values.length / 4;
    const query = (new Array(countToSave))
      .fill('UPDATE garden_member SET name = ?, lichess_handle = ?, rating = ? WHERE id = ?', 0, countToSave)
      .join(';');
    db.query(query, values, (err) => {
      if (err) {
        console.error('Could not clear previous member data:', teamId, err);
        socketWrapper.emit('member:updated', []);
        return;
      }
      socketWrapper.broadcast('member:updated', {teamId: teamId, members: members});
      getMemberList();
    });
  }

  function getPlayerList(matchId) {
    db.query(
        `SELECT garden_member.*, garden_player.id AS selected
         FROM garden_member
              LEFT JOIN garden_player
                        ON (garden_player.match_id = ?
                            AND garden_player.member_id = garden_member.id)
         WHERE garden_member.team_id = ?
           AND garden_member.deleted = false
         ORDER BY garden_member.rating DESC;
      `, [matchId, teamId], (err, result) => {
        if (err) {
          console.error('Error retrieving player list:', teamId, err);
          socketWrapper.emit('player:listed', null);
          return;
        }
        const cleanedPlayerList = result.map((item) => {
          return {
            id: item.id ? parseInt(item.id) : null,
            name: item.name || '',
            lichessHandle: item.lichess_handle || '',
            rating: parseInt(item.rating) || null,
            selected: item.selected !== null && item.selected > 0
          };
        });
        const returnData = {teamId: teamId, matchId: matchId, players: cleanedPlayerList};
        socketWrapper.emit('player:listed', returnData);
      });
  }

  function updateOpponentList(data) {
    data.opponents = data.opponents.map(sanitize);
    const values = data.opponents.reduce(sanitizePlayerList, []);
    const countToSave = values.length / 4;
    const query = (new Array(countToSave))
      .fill('UPDATE garden_opponent SET name = ?, lichess_handle = ?, rating = ? WHERE id = ?;', 0, countToSave)
      .join(';');
    db.query(query, values, (err, result) => {
      if (err) {
        console.error('Could not clear previous opponent data:', teamId, data.matchId, err);
        socketWrapper.emit('opponent:updated', []);
        return;
      }
      socketWrapper.broadcast('opponent:updated', {teamId: teamId, ...data});
      state.updatePlayerList(db, redis, teamId, data.matchId, (err) => err && console.warn('Error updating state.updatePlayerList:', err));
    });
  }

  function getOpponentList(matchId) {
    db.query(`SELECT garden_opponent.*, garden_match.deleted
              FROM garden_opponent
                   INNER JOIN garden_match
                              ON (garden_opponent.match_id = garden_match.id
                                  AND garden_match.team_id = ?
                                  AND garden_match.deleted = false)
              WHERE garden_opponent.match_id = ?
              ORDER BY garden_opponent.rating DESC;`, [teamId, matchId], (err, result) => {
      if (err) {
        console.error('Error retrieving opponent list:', teamId, err);
        socketWrapper.emit('opponent:listed', null);
        return;
      }
      const cleanedPlayerList = result.map((item) => {
        return {
          id: item.id ? parseInt(item.id) : null,
          name: item.name || '',
          lichessHandle: item.lichess_handle || '',
          rating: item.rating ? parseInt(item.rating) : null
        };
      });
      const returnData = {teamId: teamId, matchId: matchId, opponents: cleanedPlayerList};
      socketWrapper.emit('opponent:listed', returnData);
    });
  }

  function createNewMember(data) {
    const saveData = [teamId, data.name || '', data.lichessHandle || '', data.rating !== null ? Number(data.rating) : null];
    db.query('INSERT INTO garden_member (team_id, name, lichess_handle, rating) VALUES (?, ?, ?, ?);', saveData, (err, result) => {
      if (err || !result.insertId) {
        console.error('Error creating member:', teamId, (result || {}).insertId, err);
        socketWrapper.emit('member:created', {teamId: teamId, id: 0});
        return;
      }
      const cleanedMember = {
        id: result.insertId,
        name: data.name || '',
        lichessHandle: data.lichessHandle || '',
        rating: data.rating !== null ? Number(data.rating) : null
      };
      const returnData = {teamId: teamId, ...cleanedMember};
      socketWrapper.emit('member:created', returnData);
      getMemberList();
    });
  }

  function deleteMember(memberId) {
    db.query(`UPDATE garden_member
              SET deleted = true
              WHERE id = ?`, [memberId], (err, result) => {
      if (err) {
        return console.error('Error deleting member:', teamId, memberId, err);
      }
      socketWrapper.emit('member:deleted', {teamId: teamId, id: memberId});
      getMemberList();
    });
  }

  function getMemberList() {
    db.query(
        `SELECT *
         FROM garden_member
         WHERE team_id = ?
           AND deleted = false
         ORDER BY rating DESC;
      `, [teamId], (err, result) => {
        if (err) {
          console.error('Error retrieving member list:', teamId, err);
          socketWrapper.emit('member:listed', null);
          return;
        }
        const cleanedPlayerList = result.map((item) => {
          return {
            id: item.id ? parseInt(item.id) : null,
            name: item.name || '',
            lichessHandle: item.lichess_handle || '',
            rating: item.rating ? parseInt(item.rating) : null
          };
        });
        const returnData = {teamId: teamId, members: cleanedPlayerList};
        socketWrapper.emit('member:listed', returnData);
      });
  }

  function selectMember(data) {
    db.beginTransaction((err) => {
      if (err) {
        console.error('Error beginning player select transaction:', teamId, data, err);
        socketWrapper.emit('player:selected', null);
        return;
      }
      db.query('DELETE FROM garden_player WHERE match_id = ?;', [data.matchId], (err) => {
        if (err) {
          return db.rollback(() => {
            console.error('Error removing player selected data:', teamId, data, err);
            socketWrapper.emit('player:selected', null);
          });
        }
        const countToSave = data.players.length;
        const inserts = (new Array(countToSave))
          .fill('(?, ?)', 0, countToSave)
          .join(', ');
        const values = data.players.reduce((gathered, memberId) => {
          gathered.push(data.matchId, memberId);
          return gathered;
        }, []);
        db.query(`INSERT INTO garden_player (match_id, member_id) VALUES ${inserts}`, values, (err, result) => {
          if (err || !(result || {}).insertId) {
            return db.rollback(() => {
              console.error('Error inserting player selected data:', teamId, !(result || {}).insertId, data, err);
              socketWrapper.emit('player:selected', null);
            });
          }
          db.commit((err) => {
            if (err) {
              return db.rollback(() => {
                console.error('Error creating error committing:', teamId, data, err);
                socketWrapper.emit('match:created', null);
              });
            }
            socketWrapper.broadcast('player:selected', {teamId: teamId, ...data});
          });
        });
      });
    });
  }

  socketWrapper.on('member:create', createNewMember);
  socketWrapper.on('member:delete', deleteMember);
  socketWrapper.on('member:update', updateMemberList);
  socketWrapper.on('member:list', getMemberList);
  socketWrapper.on('player:select', selectMember);
  socketWrapper.on('player:list', getPlayerList);
  socketWrapper.on('opponent:update', updateOpponentList);
  socketWrapper.on('opponent:list', getOpponentList);
  return () => {
    socketWrapper.off('member:create', createNewMember);
    socketWrapper.off('member:delete', deleteMember);
    socketWrapper.off('member:update', updateMemberList);
    socketWrapper.off('member:list', getMemberList);
    socketWrapper.off('player:select', selectMember);
    socketWrapper.off('player:list', getPlayerList);
    socketWrapper.off('opponent:update', updateOpponentList);
    socketWrapper.off('opponent:list', getOpponentList);
  };
}

module.exports = playerRoute;
