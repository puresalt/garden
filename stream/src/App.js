import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Switch, useParams } from 'react-router-dom';
import socketIoClient from 'socket.io-client';
import { Config } from 'garden-common';
import Match from './Match';

const CONFIG = Config(process.env);
const socket = socketIoClient(CONFIG.socketIo.url, {
  path: '/admin'
});

function App() {
  return (
    <Router>
      <Switch>
        <Route path={['/board/:boardNumber', '/']}>
          <ParseRoute/>
        </Route>
      </Switch>
    </Router>
  );
}

function ParseRoute() {
  const {boardNumber} = useParams();
  const requestedBoardNumber = boardNumber
    ? parseInt(boardNumber)
    : null;
  return <Match
    currentBoardNumber={requestedBoardNumber}
    socket={socket}
  />;
}

export default App;
