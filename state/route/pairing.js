const ratingSort = require('garden-common/src/ratingSort');

const CHESS_BLACK = 'black';
const CHESS_WHITE = 'white';

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
  [0, 3, CHESS_BLACK, CHESS_WHITE],
  [1, 2, CHESS_BLACK, CHESS_WHITE],
  [2, 1, CHESS_WHITE, CHESS_BLACK],
  [3, 0, CHESS_WHITE, CHESS_BLACK],
  [0, 2, CHESS_WHITE, CHESS_BLACK],
  [1, 3, CHESS_WHITE, CHESS_BLACK],
  [2, 0, CHESS_BLACK, CHESS_WHITE],
  [3, 1, CHESS_BLACK, CHESS_WHITE],
  [0, 1, CHESS_WHITE, CHESS_BLACK],
  [1, 0, CHESS_WHITE, CHESS_BLACK],
  [2, 3, CHESS_BLACK, CHESS_WHITE],
  [3, 2, CHESS_BLACK, CHESS_WHITE],
  [0, 0, CHESS_BLACK, CHESS_WHITE],
  [1, 1, CHESS_BLACK, CHESS_WHITE],
  [2, 2, CHESS_WHITE, CHESS_BLACK],
  [3, 3, CHESS_WHITE, CHESS_BLACK]
];
Object.freeze(MATCH_UPS);

function updatePairing(db, socketWrapper, teamId, data, callback) {
  const values = [data.matchId, data.player.id, data.opponent.id, data.result, data.gameId, data.result, data.gameId];
  db.query(
      `INSERT INTO garden_pairing (match_id, member_id, opponent_id, result, lichess_game_id)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE result = ?,
                            lichess_game_id = ?;`, values, (err, result) => {
      if (err) {
        console.warn('Error updating pairin:', teamId, err);
        socketWrapper.emit('pairing:updated', null);
        return callback && callback(err);
      }
      if (result.insertId) {
        data.id = result.insertId;
      }
      socketWrapper.broadcastAll('pairing:updated', {teamId: teamId, ...data});
      callback && callback(null);
    });
}

function PairingRoute(db, redis, socketWrapper, teamId) {
  const _updatePairing = (data) => {
    updatePairing(db, socketWrapper, teamId, data);
  };

  function getPairingList(matchId) {
    db.query(
        `SELECT garden_member.*,
             garden_player.id AS player_id,
             garden_pairing.id AS pairing_id,
             garden_pairing.result AS result,
             garden_pairing.lichess_game_id AS lichess_game_id,
             garden_pairing.opponent_id AS opponent_id,
             garden_match.home AS home
         FROM garden_member
              INNER JOIN garden_match ON (garden_match.id = ?)
              INNER JOIN garden_player
                         ON (garden_player.match_id = garden_match.id AND garden_player.member_id = garden_member.id)
              LEFT JOIN garden_pairing
                        ON (garden_pairing.match_id = garden_match.id AND
                            garden_pairing.member_id = garden_player.member_id)
              LEFT JOIN garden_opponent
                        ON (garden_opponent.match_id = garden_match.id AND
                            garden_opponent.id = garden_pairing.opponent_id)
         WHERE garden_member.team_id = ?
           AND garden_member.deleted = false
         ORDER BY garden_pairing.id DESC, garden_member.rating DESC;
      `, [matchId, teamId], (err, memberPlayerList) => {
        if (err) {
          console.warn('Error retrieving player pairing list:', teamId, err);
          socketWrapper.emit('pairing:listed', null);
          return;
        }
        db.query(`SELECT garden_opponent.*
                  FROM garden_opponent
                       INNER JOIN garden_match
                                  ON (garden_opponent.match_id = garden_match.id
                                      AND garden_match.team_id = ?
                                      AND garden_match.deleted = false)
                  WHERE garden_opponent.match_id = ?
                  ORDER BY garden_opponent.rating DESC;`, [teamId, matchId], (err, opponentPlayerList) => {
          if (err) {
            console.warn('Error retrieving opponent pairing list:', teamId, err);
            socketWrapper.emit('pairing:listed', null);
            return;
          }

          const isHome = memberPlayerList.length
            ? memberPlayerList[0].home
            : null;
          const getUniquePlayers = memberPlayerList.reduce((gathered, item) => {
            if (!gathered.filter(gatheredItem => gatheredItem.id === item.id).length) {
              gathered.push({
                id: parseInt(item.id),
                name: item.name,
                lichess_handle: item.lichess_handle,
                rating: item.rating ? parseInt(item.rating) : null
              });
            }
            return gathered;
          }, []);
          const pairingLookUp = memberPlayerList.reduce((gathered, item) => {
            if (item.pairing_id) {
              gathered[`${item.id}:${item.opponent_id}`] = {
                id: parseInt(item.pairing_id),
                result: item.result !== null ? parseFloat(item.result) : null,
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
              id: pairing.id ? parseInt(pairing.id) : null,
              matchId: matchId,
              player: {
                id: parseInt(player.id),
                name: player.name,
                lichessHandle: player.lichess_handle,
                rating: player.rating ? parseInt(player.rating) : null
              },
              opponent: {
                id: parseInt(opponent.id),
                name: opponent.name,
                lichessHandle: opponent.lichess_handle,
                rating: opponent.rating ? parseInt(opponent.rating) : null
              },
              orientation: isHome !== false ? matchUp[2] : matchUp[3],
              result: pairing.result !== null && pairing.result !== undefined ? pairing.result : null,
              gameId: pairing.gameId || null
            }
          });
          socketWrapper.emit('pairing:listed', {matchId: matchId, pairings: matchUps});
        });
      });
  }

  socketWrapper.on('pairing:list', getPairingList);
  socketWrapper.on('pairing:update', _updatePairing);
  return () => {
    socketWrapper.off('pairing:list', getPairingList);
    socketWrapper.off('pairing:update', _updatePairing);
  };
}

const pairingRoute = module.exports = PairingRoute;
pairingRoute.updatePairing = updatePairing;
