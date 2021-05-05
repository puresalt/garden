const playerData = require('../src/playerData');

function pairingRoute(db, redis, socketWrapper) {
  function pairingList(section) {
    db.query(
      `SELECT nosc_pairing.id,
              nosc_pairing.section,
              nosc_pairing.board_id          AS boardId,
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
       WHERE nosc_pairing.section = ?
       ORDER BY board_id ASC;`,
      [section],
      (err, pairingList) => {
        if (err) {
          console.warn('Error retrieving match list:', err);
          socketWrapper.emit('match:listed', []);
          return;
        }

        socketWrapper.emit('pairing:listed', pairingList.map((pairing) => {
          return {
            id: pairing.id,
            boardId: pairing.boardId,
            home: playerData(pairing.homeId, pairing.homeName, pairing.homeHandle, pairing.homeRating, pairing.section),
            away: playerData(pairing.awayId, pairing.awayName, pairing.awayHandle, pairing.awayRating, pairing.section),
            observerBoardId: pairing.observerBoardId
          };
        }, []).filter(item => item.home !== null && item.away !== null));
      }
    );
  }

  socketWrapper.on('pairing:list', pairingList);
  return () => {
    socketWrapper.off('pairing:list', pairingList);
  };
}

module.exports = pairingRoute;
