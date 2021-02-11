import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Switch, useParams } from 'react-router-dom';
import socketIoClient from 'socket.io-client';
import { Config } from 'garden-common';
import Match from './Match';

const CONFIG = Config(process.env);
const socket = socketIoClient(CONFIG.socketIo.url, {
  path: '/admin'
});

const emptyTeam = () => {
  return {
    name: null,
    players: [
      {id: null, handle: null, rating: null},
      {id: null, handle: null, rating: null},
      {id: null, handle: null, rating: null},
      {id: null, handle: null, rating: null}
    ]
  };
};

function App() {
  return (
    <Router>
      <Switch>
        <Route path={['/match/:matchId/board/:boardNumber', '/match/:matchId', '/']}>
          <ParseRoute/>
        </Route>
      </Switch>
    </Router>
  );
}

function ParseRoute() {
  const {matchId, boardNumber} = useParams();
  const requestedMatchId = matchId
    ? parseInt(matchId)
    : 1;
  const requestedBoardNumber = boardNumber
    ? parseInt(boardNumber)
    : null;
  return <Match
    currentBoardNumber={requestedBoardNumber}
    currentMatchId={requestedMatchId - 1}
    socket={socket}
  />;
}

export default App;
