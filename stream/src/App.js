import React, {useEffect, useState} from 'react';
import {BrowserRouter as Router, Route, Switch, useParams} from 'react-router-dom';
import socketIoClient from 'socket.io-client';
import {Config, Data} from 'garden-common';
import Match from './Match';

const CONFIG = Config(process.env);
const STATE_LOOKUP = Data.StateLookup;
const socket = socketIoClient(CONFIG.socketIo.url, {
  path: '/admin'
});

function App() {
  return (
    <Router>
      <Switch>
        <Route path={['/match/:matchId/board/:boardNumber', '/board/:boardNumber', '/match/:matchId', '/']}>
          <ParseRoute/>
        </Route>
      </Switch>
    </Router>
  );
}

function ParseRoute(props) {
  const {matchId, boardNumber} = useParams();
  const requestedMatchId = matchId ? parseInt(matchId) : null;

  const [match, setMatch] = useState(() => ({id: requestedMatchId}));
  const loadMatch = (incomingMatch) => {
    if ((!match.id && requestedMatchId === null) || incomingMatch.id === match.id) {
      setMatch(incomingMatch);
    }
  };

  const requestedBoardNumber = boardNumber ? parseInt(boardNumber) : null;
  const [currentBoardNumber, setCurrentBoardNumber] = useState(requestedBoardNumber);
  const updateStreamState = (incomingStreamState) => {
    if (requestedBoardNumber || incomingStreamState.matchId !== match.id) {
      return;
    }
    setCurrentBoardNumber(incomingStreamState.boardNumber);
  };

  useEffect(() => {
    socket.emit('match:load', match.id || null);
    socket.on('match:loaded', loadMatch);
    socket.on('match:updated', loadMatch);
    return () => {
      socket.off('match:loaded', loadMatch);
      socket.off('match:updated', loadMatch);
    };
  }, []);

  useEffect(() => {
    if (!match.id) {
      return;
    }
    socket.emit('stream:load', match.id);
    socket.on('stream:loaded', updateStreamState);
    return () => {
      socket.off('stream:loaded', updateStreamState);
    };
  }, [match.id]);

  return <Match
    stateLookup={STATE_LOOKUP}
    currentBoardNumber={currentBoardNumber}
    currentMatch={match}
    socket={socket}
  />;
}

export default App;
