const playerData = require('../src/playerData');

function observerRoute(db, redis, socketWrapper) {
  function observerList(global) {
    db.query(
      `SELECT nosc_pairing.observer_board_id AS id,
              nosc_pairing.section,
              home.id                        AS homeId,
              home.name                      AS homeName,
              home.handle                    AS homeHandle,
              home.rating                    AS homeRating,
              away.id                        AS awayId,
              away.name                      AS awayName,
              away.handle                    AS awayHandle,
              away.rating                    AS awayRating
       FROM nosc_pairing
                INNER JOIN nosc_player home ON (home.id = nosc_pairing.home_id)
                INNER JOIN nosc_player away ON (away.id = nosc_pairing.away_id)
       WHERE nosc_pairing.observer_board_id IS NOT NULL
       ORDER BY nosc_pairing.observer_board_id;`,
      (err, playerList) => {
        if (err) {
          console.warn('Error retrieving match list:', err);
          socketWrapper.emit('match:listed', []);
          return;
        }

        const matchList = playerList.map((pairing) => {
          return {
            id: pairing.id,
            home: playerData(pairing.homeId, pairing.homeName, pairing.homeHandle, pairing.homeRating, pairing.section),
            away: playerData(pairing.awayId, pairing.awayName, pairing.awayHandle, pairing.awayRating, pairing.section)
          };
        });

        redis.multi()
          .get(`nosc:stream:board:1`)
          .get(`nosc:stream:board:2`)
          .get(`nosc:stream:board:3`)
          .get(`nosc:stream:board:4`)
          .get(`nosc:stream:board:5`)
          .get(`nosc:stream:board:6`)
          .get(`nosc:stream:board:7`)
          .get(`nosc:stream:board:8`)
          .exec((err, data) => {
            if (err) {
              return console.error('Error getting observer data:', err);
            }
            for (let i = 0, count = data.length; i < count; ++i) {
              if (!matchList[i]) {
                matchList[i] = {
                  id: null,
                  home: playerData(null, '', '', null, null),
                  away: playerData(null, '', '', null, null)
                };
              }
              if (data[i]) {
                matchList[i].seek = data[i];
              } else {
                let white = matchList[i].away.handle.toLowerCase();
                let black = matchList[i].home.handle.toLowerCase();
                if (white && black) {
                  matchList[i].seek = `find ${white} ${black}`;
                  redis.set(`nosc:stream:board:${matchList[i].id}`, matchList[i].seek, ((id) => (err) => {
                    if (err) {
                      console.warn('Error saving the empty game state for:', id, err);
                    }
                  })(matchList[i].id));
                }
              }
            }
            socketWrapper[global ? 'broadcastAll' : 'emit']('observer:listed', matchList);
          });
      }
    );
  }

  function observerUpdate(id, seek) {
    if (seek.substring(0, 5) === 'board') {
      return observerPick(id, parseInt(seek.substring(6)));
    }
    if (seek.substring(0, 4) === 'uscf') {
      return db.query(
        `SELECT nosc_pairing.id
         FROM nosc_player
                  INNER JOIN nosc_pairing ON (nosc_pairing.home_id = nosc_player.id OR
                                              nosc_pairing.away_id = nosc_player.id)
         WHERE nosc_player.uscf_id = ?;`,
        [parseInt(seek.substring(5))],
        (err, result) => {
          if (err || !result || !result[0] || !result[0].id) {
            return console.error('Error finding a player by their USCF ID: ', id, seek, err);
          }
          return observerPick(id, parseInt(result[0].id));
        }
      );
    }
    redis.set(`nosc:stream:board:${id}`, seek, (err) => {
      if (err) {
        return console.error('Error setting a new observer: ', id, seek, err);
      }
      observerList(true);
    });
  };

  function observerPick(observerId, pairingId) {
    db.beginTransaction((err) => {
      if (err) {
        return console.error('Error creating a transaction to update observer: ', observerId, pairingId, err);
      }
      db.query('UPDATE nosc_pairing SET observer_board_id = NULL WHERE observer_board_id = ?', [observerId], (err) => {
        if (err) {
          return console.error('Error unsetting an observer: ', observerId, pairingId, err);
        }
        db.query('UPDATE nosc_pairing SET observer_board_id = ? WHERE id = ?', [observerId, pairingId], (err) => {
          if (err) {
            return console.error('Error setting an observer: ', observerId, pairingId, err);
          }
          db.commit((err) => {
            if (err) {
              return console.error('Error committing the transaction: ', observerId, pairingId, err);
            }
            db.query(
              `SELECT home.handle AS homeHandle,
                      away.handle AS awayHandle
               FROM nosc_pairing
                        INNER JOIN nosc_player home ON (home.id = nosc_pairing.home_id)
                        INNER JOIN nosc_player away ON (away.id = nosc_pairing.away_id)
               WHERE nosc_pairing.id = ?;`,
              [pairingId],
              (err, pairing) => {
                if (err) {
                  return console.error('Error retrieving pairing data for: ', observerId, pairingId, err);
                }
                redis.set(`nosc:stream:board:${observerId}`, `find ${pairing[0].homeHandle} ${pairing[0].awayHandle}`, (err) => {
                  if (err) {
                    return console.error('Error setting a new observer: ', observerId, pairingId, err);
                  }
                  observerList(true);
                  db.query(
                    `SELECT nosc_pairing.id,
                            nosc_pairing.section,
                            nosc_pairing.observer_board_id AS observerBoardId,
                            home.id                        AS homeId,
                            home.name                      AS homeName,
                            home.handle                    AS homeHandle,
                            home.rating                    AS homeRating,
                            away.id                        AS awayId,
                            away.name                      AS awayName,
                            away.handle                    AS awayHandle,
                            away.rating                    AS awayRating
                     FROM nosc_pairing
                              INNER JOIN nosc_player home ON (home.id = nosc_pairing.home_id)
                              INNER JOIN nosc_player away ON (away.id = nosc_pairing.away_id)
                     WHERE nosc_pairing.observer_board_id IS NOT NULL
                     ORDER BY nosc_pairing.observer_board_id;`,
                    (err, pairingList) => {
                      if (err) {
                        console.warn('Error retrieving match list:', err);
                        socketWrapper.emit('match:listed', []);
                        return;
                      }

                      const matchData = [
                        {id: 1, section: 'Live Boards', matchUps: []},
                        {id: 2, section: 'Viewer Analysis', matchUps: []}
                      ];

                      pairingList.forEach((pairing) => {
                        const matchId = pairing.observerBoardId > 0 && pairing.observerBoardId < 5 ? 0 : 1;
                        const matchIdOffset = ((matchId + 1) * 4) - 4;
                        matchData[matchId].matchUps.push({
                          id: matchData[matchId].matchUps.length + 1 + matchIdOffset,
                          board: matchData[matchId].matchUps.length + 1,
                          home: playerData(pairing.homeId, pairing.homeName, pairing.homeHandle, pairing.homeRating, pairing.section),
                          away: playerData(pairing.awayId, pairing.awayName, pairing.awayHandle, pairing.awayRating, pairing.section)
                        });
                      });

                      socketWrapper.broadcastAll('match:listed', matchData);
                    }
                  );
                });
              }
            );
          })
        });
      });
    });
  };

  socketWrapper.on('observer:list', observerList);
  socketWrapper.on('observer:update', observerUpdate);
  socketWrapper.on('observer:pick', observerPick);
  return () => {
    socketWrapper.off('observer:list', observerList);
    socketWrapper.off('observer:update', observerUpdate);
    socketWrapper.off('observer:pick', observerPick);
  };
}

module.exports = observerRoute;
