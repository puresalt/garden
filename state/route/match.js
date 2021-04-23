const StreamUtility = require('../src/stream');
const playerData = require('../src/playerData');

function matchRoute(db, redis, socketWrapper) {
  const streamUtility = StreamUtility(redis);

  function matchList() {
    db.query(
      `SELECT nosc_pairing.id,
              nosc_pairing.section,
              home.id                 AS homeId,
              home.name               AS homeName,
              home.handle             AS homeHandle,
              home.rating             AS homeRating,
              nosc_pairing.home_score AS homeScore,
              away.id                 AS awayId,
              away.name               AS awayName,
              away.handle             AS awayHandle,
              away.rating             AS awayRating,
              nosc_pairing.away_score AS awayScore
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
          {id: 1, section: 'K-12 Section', matchUps: []},
          {id: 2, section: 'K-9 Section', matchUps: []}
        ];

        pairingList.forEach((pairing) => {
          const matchId = pairing.section === 'K12' ? 0 : 1;
          const matchIdOffset = ((matchId + 1) * 4) - 4;
          matchData[matchId].matchUps.push({
            id: matchData[matchId].matchUps.length + 1 + matchIdOffset,
            board: matchData[matchId].matchUps.length + 1,
            home: playerData(pairing.homeId, pairing.homeName, pairing.homeHandle, pairing.homeRating, pairing.homeScore),
            away: playerData(pairing.awayId, pairing.awayName, pairing.awayHandle, pairing.awayRating, pairing.awayScore)
          });
        });

        socketWrapper[global ? 'broadcastAll' : 'emit']('match:listed', matchData);
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
      redis.lrange(`nosc:viewer:game:${id}`, 0, -1, (err, eventList) => {
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

        currentEvent.data.orientation = currentEvent.data.orientation || 'home';
        currentEvent.data.clock = null;

        redis.rpush(`nosc:viewer:game:examine`, JSON.stringify(currentEvent), (err) => {
          if (err) {
            console.error('Error setting the stream state data:', err);
          }
          const draw = {
            type: 'draw',
            data: {
              draw: []
            }
          };
          redis.rpush(`nosc:viewer:game:examine`, JSON.stringify(draw), (err) => {
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
    redis.rpush(`nosc:viewer:game:examine`, JSON.stringify({
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
    redis.rpush(`nosc:viewer:game:examine`, JSON.stringify({
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
      redis.lrange(`nosc:viewer:game:examine`, 0, -1, (err, eventList) => {
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
