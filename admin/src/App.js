import { createBrowserHistory } from 'history';
import React, { useState, useEffect } from 'react';
import socketIoClient from 'socket.io-client';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { Config } from 'garden-common';
import './App.css';
import Header from './Header';
import Matches from './Matches';
import Configuration from './Configuration';
import Observers from './Observers';

export const history = createBrowserHistory({
  basename: process.env.PUBLIC_URL
});

const CONFIG = Config(process.env);
const socket = socketIoClient(CONFIG.socketIo.url, {
  path: '/admin'
});

function App() {
  const [isLive, setIsLive] = useState(false);
  const [observingMatch, setObservingMatch] = useState(0);
  const [observingGame, setObservingGame] = useState(0);
  const [examiningGame, setExaminingGame] = useState(0);
  const updateStreamState = (state) => {
    setIsLive(state.isLive);
    setObservingMatch(state.matchId);
    setObservingGame(state.gameId);
    setExaminingGame(state.examineId);
  };

  const handleSetIsLive = (isLive) => {
    setIsLive(isLive);
    socket.emit('stream:update', isLive);
  };

  const handleObserveMatch = (matchId) => {
    setObservingMatch(matchId);
    setObservingGame(0);
    socket.emit('match:observe', 0, matchId);
  };

  const handleObserveGame = (gameId) => {
    const matchId = Math.ceil(gameId / 4);
    if (gameId === observingGame) {
      gameId = 0;
    }
    setObservingGame(gameId);
    setObservingMatch(matchId);
    socket.emit('match:observe', gameId, matchId);
  };

  const handleExamineGame = (gameId) => {
    setExaminingGame(gameId);
    socket.emit('board:examine', gameId);
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
      <Switch>
        <Route exact path="/configuration">
          <Configuration socket={socket}/>
        </Route>
        <Route exact path="/observers">
          <Observers socket={socket}/>
        </Route>
        <Route path="/">
          <Matches
            observingMatch={observingMatch}
            handleObserveMatch={handleObserveMatch}
            observingGame={observingGame}
            handleObserveGame={handleObserveGame}
            examiningGame={examiningGame}
            handleExamineGame={handleExamineGame}
            socket={socket}
          />
        </Route>
      </Switch>
    </Router>
  )
}

export default App;
