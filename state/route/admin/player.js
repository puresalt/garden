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

function AdminPlayerRoute(dataStore, io, socket, teamId) {
  function updateMemberList(data) {
    console.log('member:update', teamId, data);
    const members = data.map(sanitize);
    const values = members.reduce(sanitizePlayerList, []);
    const countToSave = values.length / 4;
    const query = (new Array(countToSave))
      .fill('UPDATE garden_member SET name = ?, lichess_handle = ?, rating = ? WHERE id = ?', 0, countToSave)
      .join(';');
    dataStore.query(query, values, (err) => {
      if (err) {
        console.error('Could not clear previous member data:', teamId, data.matchId, err);
        socket.emit('opponent:updated', []);
        return;
      }
      const returnData = {teamId: teamId, members: members};
      console.log('member:updated', returnData);
      socket.broadcast.emit('member:updated', returnData);
      getMemberList();
    });
  }

  function getPlayerList(matchId) {
    console.log('player:list', matchId);
    dataStore.query(
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
          console.log('Error retrieving player list:', err);
          console.log('player:listed', null);
          socket.emit('player:listed', null);
          return;
        }
        const cleanedPlayerList = result.map((item) => {
          return {
            id: item.id,
            name: item.name || '',
            lichessHandle: item.lichess_handle || '',
            rating: item.rating,
            selected: item.selected !== null && item.selected > 0
          };
        });
        const returnData = {teamId: teamId, matchId: matchId, players: cleanedPlayerList};
        console.log('player:listed', returnData);
        socket.emit('player:listed', returnData);
      });
  }

  function updateOpponentList(data) {
    console.log('opponent:update', teamId, data);
    data.opponents = data.opponents.map(sanitize);
    const values = data.opponents.reduce(sanitizePlayerList(), []);
    const countToSave = values.length / 4;
    const query = (new Array(countToSave))
      .fill('UPDATE garden_opponent SET name = ?, lichess_handle = ?, rating = ? WHERE id = ?', 0, countToSave)
      .join(';');
    dataStore.query(query, values, (err, result) => {
      if (err) {
        console.error('Could not clear previous opponent data:', teamId, data.matchId, err);
        socket.emit('opponent:updated', []);
        return;
      }
      const returnData = {teamId: teamId, ...data};
      console.log('opponent:updated', returnData);
      socket.broadcase.emit('opponent:updated', returnData);
    });
  }

  function getOpponentList(matchId) {
    dataStore.query(`SELECT garden_opponent.*, garden_match.deleted
                     FROM garden_opponent
                              INNER JOIN garden_match
                                         ON (garden_opponent.match_id = garden_match.id
                                             AND garden_match.team_id = ?
                                             AND garden_match.deleted = false)
                     WHERE garden_opponent.match_id = ?
                     ORDER BY garden_opponent.rating DESC;`, [teamId, matchId], (err, result) => {
      if (err) {
        console.log('Error retrieving opponent list:', err);
        console.log('opponent:listed', null);
        socket.emit('opponent:listed', null);
        return;
      }
      const cleanedPlayerList = result.map((item) => {
        return {
          id: item.id,
          name: item.name || '',
          lichessHandle: item.lichess_handle || '',
          rating: item.rating
        };
      });
      const returnData = {teamId: teamId, matchId: matchId, opponents: cleanedPlayerList};
      console.log('opponent:listed', returnData);
      socket.emit('opponent:listed', returnData);
    });
  }

  function createNewMember(data) {
    console.log('member:create', teamId, data);
    const saveData = [teamId, data.name || '', data.lichessHandle || '', data.rating !== null ? Number(data.rating) : null];
    dataStore.query('INSERT INTO garden_member (team_id, name, lichess_handle, rating) VALUES (?, ?, ?, ?);', saveData, (err, result) => {
      console.log(err, result, saveData);
      if (err || !result.insertId) {
        console.log('Error creating member:', teamId, (result || {}).insertId, err);
        console.log('member:created', {teamId: teamId, id: 0});
        socket.emit('member:created', {teamId: teamId, id: 0});
        return;
      }
      const cleanedMember = {
        id: result.insertId,
        name: data.name || '',
        lichessHandle: data.lichessHandle || '',
        rating: data.rating !== null ? Number(data.rating) : null
      };
      const returnData = {teamId: teamId, ...cleanedMember};
      console.log('member:created', returnData);
      socket.emit('member:created', returnData);
      getMemberList();
    });
  }

  function deleteMember(memberId) {
    console.log('member:delete');
    dataStore.query(`UPDATE garden_member
                     SET deleted = true
                     WHERE id = ?`, [memberId], (err, result) => {
      if (err) {
        console.log('Error deleting member:', teamId, memberId, err);
        return;
      }
      console.log('member:deleted', {teamId: teamId, id: memberId});
      socket.emit('member:deleted', {teamId: teamId, id: memberId});
      getMemberList();
    });
  }

  function getMemberList() {
    console.log('member:list', teamId);
    dataStore.query(
        `SELECT *
         FROM garden_member
         WHERE team_id = ?
           AND deleted = false
         ORDER BY rating DESC;
      `, [teamId], (err, result) => {
        if (err) {
          console.log('Error retrieving member list:', err);
          console.log('member:listed', null);
          socket.emit('member:listed', null);
          return;
        }
        const cleanedPlayerList = result.map((item) => {
          return {
            id: item.id,
            name: item.name || '',
            lichessHandle: item.lichess_handle || '',
            rating: item.rating
          };
        });
        const returnData = {teamId: teamId, members: cleanedPlayerList};
        console.log('member:listed', returnData);
        socket.emit('member:listed', returnData);
      });
  }

  function selectMember(data) {
    console.log('player:select', teamId, data);
    dataStore.beginTransaction((err) => {
      if (err) {
        console.error('Error beginning player select transaction:', teamId, data, err);
        console.log('player:selected', teamId, null);
        socket.emit('player:selected', null);
        return;
      }
      dataStore.query('DELETE FROM garden_player WHERE match_id = ?;', [data.matchId], (err) => {
        if (err) {
          return dataStore.rollback(() => {
            console.error('Error removing player selected data:', teamId, data, err);
            console.log('player:selected', teamId, null);
            socket.emit('player:selected', null);
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
        dataStore.query(`INSERT INTO garden_player (match_id, member_id) VALUES ${inserts}`, values, (err, result) => {
          if (err || !(result || {}).insertId) {
            return dataStore.rollback(() => {
              console.error('Error inserting player selected data:', teamId, !(result || {}).insertId, data, err);
              console.log('player:selected', teamId, null);
              socket.emit('player:selected', null);
            });
          }
          dataStore.commit((err) => {
            if (err) {
              return dataStore.rollback(() => {
                console.error('Error creating error committing:', teamId, data, err);
                console.log('match:created', teamId, null);
                socket.emit('match:created', null);
              });
            }
            console.log('player:selected', data);
            socket.broadcast.emit('player:selected', data);
          });
        });
      });
    });
  }

  socket.on('member:create', createNewMember);
  socket.on('member:delete', deleteMember);
  socket.on('member:update', updateMemberList);
  socket.on('member:list', getMemberList);
  socket.on('player:select', selectMember);
  socket.on('player:list', getPlayerList);
  socket.on('opponent:update', updateOpponentList);
  socket.on('opponent:list', getOpponentList);

  return () => {
    socket.off('member:create', createNewMember);
    socket.off('member:delete', deleteMember);
    socket.off('member:update', updateMemberList);
    socket.off('member:list', getMemberList);
    socket.off('player:select', selectMember);
    socket.off('player:list', getPlayerList);
    socket.off('opponent:update', updateOpponentList);
    socket.off('opponent:list', getPlayerList);
  };
}

module.exports = AdminPlayerRoute;
