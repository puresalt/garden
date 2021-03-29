import React, { useState, useEffect } from 'react';
import socketIoClient from 'socket.io-client';
import { Config } from 'garden-common';
import Header from './Header';
import './App.css';
import Matches from './Matches';

const CONFIG = Config(process.env);
const socket = socketIoClient(CONFIG.socketIo.url, {
  path: '/admin'
});

function App() {
  const [observingMatch, setObservingMatch] = useState(0);
  const [observingGame, setObservingGame] = useState(0);
  const [examiningGame, setExaminingGame] = useState(0);
  const updateStreamState = (state) => {
    setObservingMatch(state.matchId);
    setObservingGame(state.gameId);
    setExaminingGame(state.examineId);
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
    socket.on('stream:loaded', updateStreamState);
    socket.emit('stream:load');
    return () => {
      socket.off('stream:loaded', updateStreamState);
    }
  }, []);

  return (
    <>
      <Header/>
      <Matches
        observingMatch={observingMatch}
        handleObserveMatch={handleObserveMatch}
        observingGame={observingGame}
        handleObserveGame={handleObserveGame}
        examiningGame={examiningGame}
        handleExamineGame={handleExamineGame}
        socket={socket}
      />
    </>
  )
}

export default App;
