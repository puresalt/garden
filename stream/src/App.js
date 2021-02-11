import React from 'react';
import { BrowserRouter as Router, Route, Switch, useParams, useLocation } from 'react-router-dom';
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
        <Route path={['/board/:boardNumber', '/small', '/']}>
          <ParseRoute/>
        </Route>
      </Switch>
    </Router>
  );
}

function ParseRoute() {
  const {boardNumber} = useParams();
  const small = useLocation().pathname === '/small';
  const requestedBoardNumber = boardNumber
    ? parseInt(boardNumber)
    : null;
  return <Match
    currentBoardNumber={requestedBoardNumber}
    small={small}
    socket={socket}
  />;
}

export default App;
