const ratingSort = require('gcss-common/src/ratingSort');

const emptyPlayer = () => {
  return {
    id: null,
    name: null,
    lichess_handle: null,
    rating: null
  }
};

const COMPLETE_LIST = [0, -1];
Object.freeze(COMPLETE_LIST);
const MATCH_UPS = [
  [0, 3],
  [1, 2],
  [2, 1],
  [3, 0],
  [0, 2],
  [1, 3],
  [2, 0],
  [3, 1],
  [0, 1],
  [1, 0],
  [2, 3],
  [3, 2],
  [0, 0],
  [1, 1],
  [2, 2],
  [3, 3]
];
Object.freeze(MATCH_UPS);

function updatePairing(db, io, socket, teamId, data, callback) {
  console.log('pairing:update', teamId, data);
  const values = [data.matchId, data.player.id, data.opponent.id, data.result, data.gameId, data.result, data.gameId];
  db.query(
      `INSERT INTO garden_pairing (match_id, member_id, opponent_id, result, lichess_game_id)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE result = ?,
                            lichess_game_id = ?;`, values, (err, result) => {
      if (err) {
        console.log('Error updating pairin:', err);
        console.log('pairing:updated', null);
        socket.emit('pairing:updated', null);
        return callback && callback(err);
      }
      if (result.insertId) {
        data.id = result.insertId;
      }
      console.log('pairing:updated', teamId, data);
      io.sockets.emit('pairing:updated', teamId, data);
      callback && callback(null);
    });
}

function PairingRoute(db, redis, io, socket, teamId) {
  const _updatePairing = (data) => {
    updatePairing(db, io, socket, teamId, data);
  };

  function getPairingList(matchId) {
    console.log('pairing:list', matchId);
    db.query(
        `SELECT garden_member.*,
             garden_player.id AS player_id,
             garden_pairing.id AS pairing_id,
             garden_pairing.result AS result,
             garden_pairing.lichess_game_id AS lichess_game_id,
             garden_pairing.opponent_id AS opponent_id
         FROM garden_member
              INNER JOIN garden_player
                         ON (garden_player.match_id = ? AND garden_player.member_id = garden_member.id)
              LEFT JOIN garden_pairing
                        ON (garden_pairing.match_id = garden_player.match_id AND
                            garden_pairing.member_id = garden_player.member_id)
              LEFT JOIN garden_opponent
                        ON (garden_opponent.match_id = garden_player.match_id AND
                            garden_opponent.id = garden_pairing.opponent_id)
         WHERE garden_member.team_id = ?
           AND garden_member.deleted = false
         ORDER BY garden_pairing.id DESC, garden_member.rating DESC;
      `, [matchId, teamId], (err, memberPlayerList) => {
        if (err) {
          console.log('Error retrieving player pairing list:', err);
          console.log('pairing:listed', null);
          socket.emit('pairing:listed', null);
          return;
        }
        db.query(`SELECT garden_opponent.*, garden_match.deleted
                  FROM garden_opponent
                       INNER JOIN garden_match
                                  ON (garden_opponent.match_id = garden_match.id
                                      AND garden_match.team_id = ?
                                      AND garden_match.deleted = false)
                  WHERE garden_opponent.match_id = ?
                  ORDER BY garden_opponent.rating DESC;`, [teamId, matchId], (err, opponentPlayerList) => {
          if (err) {
            console.log('Error retrieving opponent pairing list:', err);
            console.log('pairing:listed', null);
            socket.emit('pairing:listed', null);
            return;
          }

          const getUniquePlayers = memberPlayerList.reduce((gathered, item) => {
            if (!gathered.filter(gatheredItem => gatheredItem.id === item.id).length) {
              gathered.push({
                id: item.id,
                name: item.name,
                lichess_handle: item.lichess_handle,
                rating: item.rating
              });
            }
            return gathered;
          }, []);
          const pairingLookUp = memberPlayerList.reduce((gathered, item) => {
            if (item.pairing_id) {
              gathered[`${item.id}:${item.opponent_id}`] = {
                id: item.pairing_id,
                result: item.result,
                gameId: item.lichess_game_id
              }
            }
            return gathered;
          }, {});
          getUniquePlayers.sort(ratingSort);
          const matchUps = MATCH_UPS.map((matchUp) => {
            const player = getUniquePlayers[matchUp[0]] || emptyPlayer();
            const opponent = opponentPlayerList[matchUp[1]] || emptyPlayer();
            const pairing = pairingLookUp[`${player.id}:${opponent.id}`] || {};
            return {
              id: pairing.id || null,
              matchId: matchId,
              player: {
                id: player.id,
                name: player.name,
                lichessHandle: player.lichess_handle,
                rating: player.rating
              },
              opponent: {
                id: opponent.id,
                name: opponent.name,
                lichessHandle: opponent.lichess_handle,
                rating: opponent.rating
              },
              result: pairing.result !== null && pairing.result !== undefined ? pairing.result : null,
              gameId: pairing.gameId || null
            }
          });
          console.log('pairing:listed', teamId, JSON.stringify({matchId: matchId, pairings: matchUps}, null, 2));
          socket.emit('pairing:listed', {matchId: matchId, pairings: matchUps});
        });
      });
  }

  socket.on('pairing:list', getPairingList);
  socket.on('pairing:update', _updatePairing);

  return () => {
    socket.off('pairing:list', getPairingList);
    socket.off('pairing:update', _updatePairing);
  };
}

const pairingRoute = module.exports = PairingRoute;
pairingRoute.updatePairing = updatePairing;
