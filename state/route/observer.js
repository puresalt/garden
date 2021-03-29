function isOdd(num) {
  return num % 2 === 1;
}

function observerRoute(db, redis, socketWrapper) {
  function observerList(global) {
    db.query(
      `SELECT college_player.team_id AS playerTeamId,
              college_player.name,
              college_player.handle,
              college_player.rating,
              home_pairing.id        AS homeTeamPairingId,
              home_team.id           AS homeTeamId,
              home_team.name         AS homeTeamName,
              away_pairing.id        AS awayTeamPairingId,
              away_team.id           AS awayTeamId,
              away_team.name         AS awayTeamName
       FROM college_player
                LEFT JOIN college_pairing home_pairing ON (college_player.team_id = home_pairing.home_id)
                LEFT JOIN college_team home_team ON (home_pairing.home_id = home_team.id)
                LEFT JOIN college_pairing away_pairing ON (college_player.team_id = away_pairing.away_id)
                LEFT JOIN college_team away_team ON (away_pairing.away_id = away_team.id)
       ORDER BY college_player.id;`,
      (err, playerList) => {
        if (err) {
          console.warn('Error retrieving match list:', err);
          socketWrapper.emit('match:listed', []);
          return;
        }

        const matchList = playerList.reduce((gathered, player) => {
          const matchId = (player.homeTeamPairingId || player.awayTeamPairingId);
          const startIndex = (matchId * 4) - 4;
          const isHome = player.homeTeamId !== null;
          if (isHome) {
            for (let i = 0, count = 4; i < count; ++i) {
              if (gathered[startIndex + i].home === null) {
                gathered[startIndex + i].home = {
                  name: player.name,
                  handle: player.handle,
                  rating: player.rating
                };
                break;
              }
            }
          } else {
            for (let i = 0, count = 4; i < count; ++i) {
              if (gathered[startIndex + i].away === null) {
                gathered[startIndex + i].away = {
                  name: player.name,
                  handle: player.handle,
                  rating: player.rating
                };
                break;
              }
            }
          }

          return gathered;
        }, [
          {id: 1, home: null, away: null, seek: null},
          {id: 2, home: null, away: null, seek: null},
          {id: 3, home: null, away: null, seek: null},
          {id: 4, home: null, away: null, seek: null},
          {id: 5, home: null, away: null, seek: null},
          {id: 6, home: null, away: null, seek: null},
          {id: 7, home: null, away: null, seek: null},
          {id: 8, home: null, away: null, seek: null}
        ]).filter(item => item.home !== null && item.away !== null);

        redis.multi()
          .get(`college:stream:board:1`)
          .get(`college:stream:board:2`)
          .get(`college:stream:board:3`)
          .get(`college:stream:board:4`)
          .get(`college:stream:board:5`)
          .get(`college:stream:board:6`)
          .get(`college:stream:board:7`)
          .get(`college:stream:board:8`)
          .exec((err, data) => {
            if (err) {
              return console.error('Error getting observer data:', err);
            }
            for (let i = 0, count = data.length; i < count; ++i) {
              if (data[i]) {
                matchList[i].seek = data[i];
              } else {
                let white = matchList[i].away.handle.toLowerCase();
                let black = matchList[i].home.handle.toLowerCase();
                if (isOdd(matchList[i].id)) {
                  white = matchList[i].home.handle.toLowerCase();
                  black = matchList[i].away.handle.toLowerCase();
                }
                matchList[i].seek = `find ${white} ${black}`;
                redis.set(`college:stream:board:${matchList[i].id}`. matchList[i].seek, ((id) => (err) => {
                  if (err) {
                    console.warn('Error saving the empty game state for:', id, err);
                  }
                })(matchList[i].id));
              }
            }
            socketWrapper[global ? 'broadcastAll' : 'emit']('observer:listed', matchList);
          });
      }
    );
  }

  function observerUpdate(id, seek) {
    redis.set(`college:stream:board:${id}`, seek, (err) => {
      if (err) {
        return console.error('Error setting a new observer: ', id, seek, err);
      }
      observerList(true);
    });
  };

  socketWrapper.on('observer:list', observerList);
  socketWrapper.on('observer:update', observerUpdate);
  return () => {
    socketWrapper.off('observer:list', observerList);
    socketWrapper.off('observer:update', observerUpdate);
  };
}

module.exports = observerRoute;
