import React, {useEffect} from 'react';
import {BrowserRouter as Router, Redirect, Route, Switch} from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Dashboard from './Dashboard';
import Board from './Boards';
import Results from './Results';
import Header from './Header';
import {Config, Data} from 'gscc-common';
import './App.css';
import socketIoClient from 'socket.io-client';
import Matches from './Matches';

const CONFIG = Config(process.env);
const STATE_LOOKUP = Data.StateLookup;

const socket = socketIoClient(CONFIG.socketIo.url, {
  path: '/admin'
});

function usePersistentState(key, defaultValue) {
  const [state, setState] = React.useState(() => {
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
  const [currentMatchId, setCurrentMatchId] = usePersistentState('currentMatchId', 0);
  const updateCurrentMatchId = (newMatchId) => {
    setCurrentMatchId(newMatchId);
  };
  const [currentOpponent, setCurrentOpponent] = usePersistentState('currentOpponent', '');
  const updateCurrentOpponent = (newOpponent) => {
    setCurrentOpponent(newOpponent);
  };

  const handleMatchLoad = (match) => {
    if (match && match.id) {
      setCurrentMatchId(match.id);
      setCurrentOpponent(match.opponent);
    } else {
      setCurrentMatchId(0);
      setCurrentOpponent('');
    }
  };
  const handleMatchExistenceCheck = (data) => {
    console.log('huh?', data, currentMatchId, data.id === currentMatchId && !data.exists);
    if (data.id === currentMatchId && !data.exists) {
      setCurrentMatchId(0);
      setCurrentOpponent('');
    }
  };
  useEffect(() => {
    socket.on('match:loaded', handleMatchLoad);
    socket.on('match:exists', handleMatchExistenceCheck);
    return () => {
      socket.off('match:loaded', handleMatchLoad);
      socket.off('match:exists', handleMatchExistenceCheck);
    }
  }, []);

  useEffect(() => {
    socket.emit('match:exist', currentMatchId);
    socket.emit('match:load', currentMatchId);
  }, []);

  return (
    <Router>
      <Header
        currentMatchId={currentMatchId}
        currentOpponent={currentOpponent}
        stateLookup={STATE_LOOKUP}
        socket={socket}
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
            <Route path="/results">
              {
                currentMatchId
                  ? <Results
                    currentMatchId={currentMatchId}
                    currentOpponent={currentOpponent}
                    stateLookup={STATE_LOOKUP}
                    socket={socket}
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
