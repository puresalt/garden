import { createBrowserHistory } from 'history';
import React, { useState, useEffect } from 'react';
import socketIoClient from 'socket.io-client';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import { Config } from 'garden-common';
import Header from './Header';
import './App.css';
import Dashboard from './Dashboard';
import Pairings from './Pairings';
import Boards from './Boards';
import Configuration from './Configuration';

export const history = createBrowserHistory({
  basename: process.env.PUBLIC_URL
});

const CONFIG = Config(process.env);
const socket = socketIoClient(CONFIG.socketIo.url, {
  path: '/admin'
});

function App() {
  const [isLive, setIsLive] = useState(false);
  const [watchedPairing, setWatchedPairing] = useState(0);
  const updateStreamState = (state) => {
    setIsLive(state.isLive);
    setWatchedPairing(state.pairingId);
  };

  const handleSetIsLive = (isLive) => {
    setIsLive(isLive);
    socket.emit('stream:update', isLive);
  };

  const handleWatchedPairing = (pairingId) => {
    setWatchedPairing(pairingId);
    socket.emit('pairing:watch', pairingId);
  };

  useEffect(() => {
    socket.emit('stream:load');
    socket.on('stream:loaded', updateStreamState);
    return () => {
      socket.off('stream:loaded', updateStreamState);
    }
  }, []);

  return (
    <Router>
      <Header
        socket={socket}
        isLive={isLive}
        updateSetIsLive={handleSetIsLive}
      />
      <div className="position-relative">
        <Container className="p-3">
          <Switch>
            <Route exact path="/">
              <Dashboard socket={socket}/>
            </Route>
            <Route path="/pairings">
              <Pairings socket={socket} watchedPairing={watchedPairing} handleWatchedPairing={handleWatchedPairing}/>
            </Route>
            <Route path="/boards">
              <Boards socket={socket}/>
            </Route>
            <Route path="/configuration">
              <Configuration socket={socket}/>
            </Route>
          </Switch>
        </Container>
      </div>
    </Router>
  )
}

export default App;
