function matchRoute(db, redis, socketWrapper) {
  function pairingList(global) {
    db.query(
      `SELECT usate_player.team_id AS playerTeamId,
              usate_player.name,
              usate_player.handle,
              usate_player.rating,
              home_pairing.id      AS homeTeamPairingId,
              home_team.id         AS homeTeamId,
              home_team.name       AS homeTeamName,
              away_pairing.id      AS awayTeamPairingId,
              away_team.id         AS awayTeamId,
              away_team.name       AS awayTeamName
       FROM usate_player
                LEFT JOIN usate_pairing home_pairing ON (usate_player.team_id = home_pairing.home_id)
                LEFT JOIN usate_team home_team ON (home_pairing.home_id = home_team.id)
                LEFT JOIN usate_pairing away_pairing ON (usate_player.team_id = away_pairing.away_id)
                LEFT JOIN usate_team away_team ON (away_pairing.away_id = away_team.id)
       ORDER BY usate_player.id;`,
      (err, playerList) => {
        if (err) {
          console.warn('Error retrieving match list:', err);
          socketWrapper.emit('pairing:listed', []);
          return;
        }

        const pairingList = playerList.reduce((gathered, player) => {
          const pairingId = (player.homeTeamPairingId || player.awayTeamPairingId);
          if (!gathered[pairingId - 1]) {
            gathered[pairingId - 1] = {
              id: pairingId,
              home: player.homeTeamName,
              away: player.awayTeamName,
              matchUps: [
                {board: 1, home: null, away: null},
                {board: 2, home: null, away: null},
                {board: 3, home: null, away: null},
                {board: 4, home: null, away: null}
              ]
            };
          }

          const isHome = player.homeTeamId !== null;
          if (isHome) {
            if (!gathered[pairingId - 1].home) {
              gathered[pairingId - 1].home = player.homeTeamName;
            }
            for (let i = 0, count = gathered[pairingId - 1].matchUps.length; i < count; ++i) {
              if (gathered[pairingId - 1].matchUps[i].home === null) {
                gathered[pairingId - 1].matchUps[i].home = {
                  name: player.name,
                  handle: player.handle,
                  rating: player.rating
                };
                break;
              }
            }
          } else {
            if (!gathered[pairingId - 1].away) {
              gathered[pairingId - 1].away = player.awayTeamName;
            }
            for (let i = 0, count = gathered[pairingId - 1].matchUps.length; i < count; ++i) {
              if (gathered[pairingId - 1].matchUps[i].away === null) {
                gathered[pairingId - 1].matchUps[i].away = {
                  name: player.name,
                  handle: player.handle,
                  rating: player.rating
                };
                break;
              }
            }
          }

          return gathered;
        }, []);

        socketWrapper[global ? 'broadcastAll' : 'emit']('pairing:listed', pairingList);
      }
    );
  }

  function watchPairing(id) {
    db.query(
      `SELECT usate_player.team_id AS playerTeamId,
              usate_player.name,
              usate_player.handle,
              usate_player.rating,
              home_pairing.id      AS homeTeamPairingId,
              home_team.id         AS homeTeamId,
              home_team.name       AS homeTeamName,
              away_pairing.id      AS awayTeamPairingId,
              away_team.id         AS awayTeamId,
              away_team.name       AS awayTeamName
       FROM usate_player
                LEFT JOIN usate_pairing home_pairing ON (usate_player.team_id = home_pairing.home_id)
                LEFT JOIN usate_team home_team ON (home_pairing.home_id = home_team.id)
                LEFT JOIN usate_pairing away_pairing ON (usate_player.team_id = away_pairing.away_id)
                LEFT JOIN usate_team away_team ON (away_pairing.away_id = away_team.id)
                INNER JOIN usate_pairing pairing ON (pairing.id = ? AND (usate_player.team_id = home_pairing.home_id OR
                                                                         usate_player.team_id = away_pairing.away_id))
       ORDER BY usate_player.id;`,
      [id],
      (err, playerList) => {
        if (err) {
          console.error('Error finding pair data to watch:', err);
          return;
        }

        const pairing = playerList.reduce((gathered, player) => {
          const isHome = player.homeTeamId !== null;
          if (isHome) {
            if (!gathered.home) {
              gathered.home = player.homeTeamName;
            }
            for (let i = 0, count = gathered.matchUps.length; i < count; ++i) {
              if (gathered.matchUps[i].home === null) {
                gathered.matchUps[i].home = {
                  name: player.name,
                  handle: player.handle,
                  rating: player.rating
                };
                break;
              }
            }
          } else {
            if (!gathered.away) {
              gathered.away = player.awayTeamName;
            }
            for (let i = 0, count = gathered.matchUps.length; i < count; ++i) {
              if (gathered.matchUps[i].away === null) {
                gathered.matchUps[i].away = {
                  name: player.name,
                  handle: player.handle,
                  rating: player.rating
                };
                break;
              }
            }
          }

          return gathered;
        }, {
          id: id,
          home: null,
          away: null,
          matchUps: [
            {board: 1, home: null, away: null},
            {board: 2, home: null, away: null},
            {board: 3, home: null, away: null},
            {board: 4, home: null, away: null}
          ]
        });

        const stateData = {
          isLive: '1',
          boardNumber: '0',
          pairingId: id,
          home: pairing.home,
          away: pairing.away
        };

        const hset = Object.keys(stateData).reduce((gathered, key) => {
          gathered.push(key, stateData[key]);
          return gathered;
        }, []);

        redis.hset('usate:stream:state', hset, (err) => {
          if (err) {
            console.error('Error setting the pair state data:', err);
          }
          const boardData = pairing.matchUps.reduce((gathered, row, i) => {
            gathered[`${row.board}:home:name`] = row.home.name;
            gathered[`${row.board}:home:handle`] = row.home.handle;
            gathered[`${row.board}:home:rating`] = row.home.rating;
            gathered[`${row.board}:away:name`] = row.away.name;
            gathered[`${row.board}:away:handle`] = row.away.handle;
            gathered[`${row.board}:away:rating`] = row.away.rating;
            return gathered;
          }, {});
          const hset = Object.keys(boardData).reduce((gathered, key) => {
            gathered.push(key, boardData[key]);
            return gathered;
          }, []);
          redis.hset('usate:stream:board', hset, (err) => {
            if (err) {
              console.error('Error setting the pair player data:', err);
            }
          });
          socketWrapper.broadcastAll('stream:loaded', stateData);
        });
      });
  };

  socketWrapper.on('pairing:list', pairingList);
  socketWrapper.on('pairing:watch', watchPairing);
  return () => {
    socketWrapper.off('pairing:list', pairingList);
    socketWrapper.off('pairing:watch', watchPairing);
  };
}

module.exports = matchRoute;
