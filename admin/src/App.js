import {createBrowserHistory} from 'history';
import React, {useEffect, useState} from 'react';
import socketIoClient from 'socket.io-client';
import {BrowserRouter as Router, Redirect, Route, Switch} from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import {Config, Data} from 'garden-common';
import Matches from './Matches';
import Dashboard from './Dashboard';
import Board from './Boards';
import Pairings from './Pairings';
import Members from './Members';
import Header from './Header';
import './App.css';

export const history = createBrowserHistory({
  basename: process.env.PUBLIC_URL
});

const CONFIG = Config(process.env);
const STATE_LOOKUP = Data.StateLookup;
const socket = socketIoClient(CONFIG.socketIo.url, {
  path: '/admin'
});

function usePersistentState(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      return JSON.parse(String(localStorage.getItem(key))) || defaultValue;
    } catch (e) {
    }
    return defaultValue;
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);
  return [state, setState];
}

function App() {
  const [isLive, setIsLive] = useState(false);
  const updateSetIsLive = (isLive) => {
    setIsLive(isLive);
  };
  const [currentMatchId, setCurrentMatchId] = usePersistentState('currentMatchId', 0);
  const updateCurrentMatchId = (newMatchId) => {
    setCurrentMatchId(newMatchId);
  };
  const [currentOpponent, setCurrentOpponent] = usePersistentState('currentOpponent', '');
  const updateCurrentOpponent = (newOpponent) => {
    setCurrentOpponent(newOpponent);
  };
  const [isHome, setIsHome] = usePersistentState('isHome', false);
  const updateIsHome = (isHome) => {
    setIsHome(isHome);
  };

  const handleMatchLoad = (match) => {
    if (match && match.id) {
      setCurrentMatchId(match.id);
      setCurrentOpponent(match.opponent);
      setIsHome(match.isHome);
    } else {
      setCurrentMatchId(0);
      setCurrentOpponent('');
      setIsHome(false);
    }
  };
  const handleMatchExistenceCheck = (data) => {
    if (data.id === currentMatchId && !data.exists) {
      setCurrentMatchId(0);
      setCurrentOpponent('');
      updateIsHome(false);
    }
  };
  useEffect(() => {
    socket.emit('match:load', currentMatchId);
    socket.on('match:loaded', handleMatchLoad);
    socket.on('match:exists', handleMatchExistenceCheck);
    return () => {
      socket.off('match:loaded', handleMatchLoad);
      socket.off('match:exists', handleMatchExistenceCheck);
    }
  }, []);

  return (
    <Router>
      <Header
        currentMatchId={currentMatchId}
        currentOpponent={currentOpponent}
        stateLookup={STATE_LOOKUP}
        socket={socket}
        isLive={isLive}
        updateSetIsLive={updateSetIsLive}
      />
      <div className="position-relative">
        <Container className="p-3">
          <Switch>
            <Route path="/boards">
              {
                currentMatchId
                  ? <Board
                    currentMatchId={currentMatchId}
                    socket={socket}
                  />
                  : <Redirect to="/"/>
              }
            </Route>
            <Route path="/pairings">
              {
                currentMatchId
                  ? <Pairings
                    currentMatchId={currentMatchId}
                    currentOpponent={currentOpponent}
                    stateLookup={STATE_LOOKUP}
                    socket={socket}
                    isHome={isHome}
                  />
                  : <Redirect to="/"/>
              }
            </Route>
            <Route path="/dashboard">
              {
                currentMatchId
                  ? <Dashboard
                    currentMatchId={currentMatchId}
                    currentOpponent={currentOpponent}
                    updateCurrentOpponent={updateCurrentOpponent}
                    stateLookup={STATE_LOOKUP}
                    socket={socket}
                  />
                  : <Redirect to="/"/>
              }
            </Route>
            <Route path="/members">
              <Members
                socket={socket}
              />
            </Route>
            <Route path="/">
              <Matches
                currentMatchId={currentMatchId}
                stateLookup={STATE_LOOKUP}
                socket={socket}
                updateCurrentMatchId={updateCurrentMatchId}
                updateCurrentOpponent={updateCurrentOpponent}
              />
            </Route>
          </Switch>
        </Container>
      </div>
    </Router>
  )
}

export default App;
