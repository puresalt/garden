const StreamUtility = require('../src/stream');

function isOdd(num) {
  return num % 2 === 1;
}

function matchRoute(db, redis, socketWrapper) {
  const streamUtility = StreamUtility(redis);

  function matchList(global) {
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
          if (!gathered[matchId - 1]) {
            const matchIdOffset = (matchId * 4) - 4;
            gathered[matchId - 1] = {
              id: matchId,
              home: {id: player.homeTeamId, name: player.homeTeamName},
              away: {id: player.awayTeamId, name: player.awayTeamName},
              matchUps: [
                {id: matchIdOffset + 1, board: 1, home: null, away: null},
                {id: matchIdOffset + 2, board: 2, home: null, away: null},
                {id: matchIdOffset + 3, board: 3, home: null, away: null},
                {id: matchIdOffset + 4, board: 4, home: null, away: null}
              ]
            };
          }

          const isHome = player.homeTeamId !== null;
          if (isHome) {
            if (!gathered[matchId - 1].home.id) {
              gathered[matchId - 1].home = {id: player.homeTeamId, name: player.homeTeamName};
            }
            for (let i = 0, count = gathered[matchId - 1].matchUps.length; i < count; ++i) {
              if (gathered[matchId - 1].matchUps[i].home === null) {
                gathered[matchId - 1].matchUps[i].home = {
                  name: player.name,
                  handle: player.handle,
                  rating: player.rating
                };
                break;
              }
            }
          } else {
            if (!gathered[matchId - 1].away.id) {
              gathered[matchId - 1].away = {id: player.awayTeamId, name: player.awayTeamName};
            }
            for (let i = 0, count = gathered[matchId - 1].matchUps.length; i < count; ++i) {
              if (gathered[matchId - 1].matchUps[i].away === null) {
                gathered[matchId - 1].matchUps[i].away = {
                  name: player.name,
                  handle: player.handle,
                  rating: player.rating
                };
                break;
              }
            }
          }

          return gathered;
        }, []).filter(item => item.home !== null && item.away !== null);

        socketWrapper[global ? 'broadcastAll' : 'emit']('match:listed', matchList);
      }
    );
  }

  function observe(gameId, matchId) {
    streamUtility.setState({gameId, matchId}, (err, data) => {
      if (err) {
        console.error('Error setting the stream state data:', err);
      }
      socketWrapper.broadcast('stream:loaded', data);
    });
  };

  function examineGame(id) {
    streamUtility.setState({examineId: id}, (err, data) => {
      if (err) {
        console.error('Error setting the pair state data:', err);
      }
      redis.lrange(`college:viewer:game:${id}`, 0, -1, (err, eventList) => {
        if (err) {
          return console.warn('Error catching up or nothing in the list to catch up to:', id, eventList, err);
        }

        let currentEventId;
        let currentEvent;
        let resultEvent;
        for (currentEventId = eventList.length - 1; currentEventId > 0; --currentEventId) {
          currentEvent = JSON.parse(eventList[currentEventId]);
          if (currentEvent && currentEvent.type) {
            if (currentEvent.type === 'goto' || currentEvent.type === 'start') {
              break;
            } else if (currentEvent.type === 'result') {
              resultEvent = currentEvent;
            }
          }
        }

        if (!currentEvent || !currentEvent.data || !currentEvent.data.fen) {
          currentEvent = {
            type: 'goto',
            data: {
              fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
              clock: null,
              moveList: [],
              moving: 'home'
            }
          };
        }

        currentEvent.data.orientation = currentEvent.data.orientation || isOdd(id) ? 'home' : 'away';
        currentEvent.data.clock = null;

        redis.rpush(`college:viewer:game:examine`, JSON.stringify(currentEvent), (err) => {
          if (err) {
            console.error('Error setting the stream state data:', err);
          }
          const draw = {
            type: 'draw',
            data: {
              draw: []
            }
          };
          redis.rpush(`college:viewer:game:examine`, JSON.stringify(draw), (err) => {
            if (err) {
              console.error('Error setting the stream state data:', err);
            }
            socketWrapper.broadcastAll('board:examine', draw);
            socketWrapper.broadcastAll('viewer:board:examine', draw);
            socketWrapper.broadcastAll('board:examine', currentEvent);
            socketWrapper.broadcastAll('viewer:board:examine', currentEvent);
          });
        });
      });
    });
  };

  function announceExamineEvent(type, data) {
    socketWrapper.broadcast('board:examine', {type, data});
    socketWrapper.broadcast('viewer:board:examine', {type, data});
  }

  function drawShape(data) {
    redis.rpush(`college:viewer:game:examine`, JSON.stringify({
      type: 'draw',
      data: data
    }), (err) => {
      if (err) {
        return console.warn('Error drawing:', data, err);
      }
      announceExamineEvent('draw', data);
    });
  }

  function movePiece(data) {
    redis.rpush(`college:viewer:game:examine`, JSON.stringify({
      type: 'goto',
      data: data
    }), (err) => {
      if (err) {
        return console.warn('Error saving a move:', data, err);
      }
      announceExamineEvent('goto', data);
    });
  }

  function startExamineSession(emitExamineEvent) {
    return () => {
      redis.lrange(`college:viewer:game:examine`, 0, -1, (err, eventList) => {
        if (err) {
          return console.warn('Error catching up or nothing in the list to catch up to:', eventList, err);
        }

        let currentEventId;
        let currentEvent;
        let resultEvent;
        for (currentEventId = eventList.length - 1; currentEventId > 0; --currentEventId) {
          currentEvent = JSON.parse(eventList[currentEventId]);
          if (currentEvent && currentEvent.type) {
            if (currentEvent.type === 'goto' || currentEvent.type === 'start') {
              break;
            } else if (currentEvent.type === 'result') {
              resultEvent = currentEvent;
            }
          }
        }

        if (!currentEvent || !currentEvent.data || !currentEvent.data.fen) {
          return emitExamineEvent({
            type: 'goto',
            data: {
              fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
              clock: [1500, 1500],
              moveList: [],
              moving: 'home'
            }
          });
        }

        emitExamineEvent(currentEvent);
        for (let i = currentEventId, eventCount = eventList.length; i < eventCount; ++i) {
          const event = JSON.parse(eventList[i]);
          if (event.data) {
            emitExamineEvent(event);
          }
        }
      });
    };
  }

  const examineStart = startExamineSession((event) => socketWrapper.emit('board:examine', event));
  const viewerExamineStart = startExamineSession((event) => socketWrapper.emit('viewer:board:examine', event));

  socketWrapper.on('match:list', matchList);
  socketWrapper.on('match:observe', observe);
  socketWrapper.on('board:examine', examineGame);
  socketWrapper.on('board:examine:start', examineStart);
  socketWrapper.on('viewer:board:examine:start', viewerExamineStart);
  socketWrapper.on('board:examine:draw', drawShape);
  socketWrapper.on('board:examine:move', movePiece);
  return () => {
    socketWrapper.off('match:list', matchList);
    socketWrapper.off('match:observe', observe);
    socketWrapper.off('board:examine', examineGame);
    socketWrapper.off('board:examine:start', examineStart);
    socketWrapper.off('viewer:board:examine:start', viewerExamineStart);
    socketWrapper.off(`board:examine:draw`, drawShape);
    socketWrapper.off(`board:examine:move`, movePiece);
  };
}

module.exports = matchRoute;
