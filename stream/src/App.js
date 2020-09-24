import React, {useEffect, useState} from 'react';
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';
import socketIoClient from 'socket.io-client';
import {Config, Data} from 'gscc-common';
import Board from './Board';
import Score from './Score';
import TitleBar from './TitleBar';
import IndividualBoard from './IndividualBoard';
import './App.css';

const CONFIG = Config(process.env);
const STATE_LOOKUP = Data.StateLookup;
const socket = socketIoClient(CONFIG.socketIo.url, {
  path: '/admin'
});
const teamName = 'New Jersey';
const currentMatchId = 1;
const totalBoardNumber = 4;

function App() {
  const [match, setMatch] = useState({});
  const loadMatch = (incomingMatch) => {
    if (incomingMatch.id === currentMatchId) {
      setMatch(incomingMatch);
    }
  };
  useEffect(() => {
    socket.emit('match:load', currentMatchId);
    socket.on('match:loaded', loadMatch);
    socket.on('match:updated', loadMatch);
    return () => {
      socket.off('match:loaded', loadMatch);
      socket.on('match:updated', loadMatch);
    };
  }, []);

  const [awayTeamScore, setAwayTeamScore] = useState(0);
  const [homeTeamScore, setHomeTeamScore] = useState(0);
  const [pairings, setPairings] = useState([]);
  const loadPairings = (incomingPairings) => {
    if (incomingPairings.matchId !== currentMatchId) {
      return;
    }
    const [parsedPairings, homeTeamScore, awayTeamScore] = incomingPairings.pairings.reduce((gathered, pairing, i) => {
      const boardIndex = i % totalBoardNumber;
      if (!gathered[0][boardIndex]) {
        gathered[0][boardIndex] = {
          name: pairing.player.name,
          rating: pairing.player.rating,
          pairings: []
        };
      }
      gathered[0][boardIndex].pairings.push({
        name: pairing.opponent.name,
        rating: pairing.opponent.rating,
        result: pairing.result,
        orientation: pairing.orientation
      });
      if (pairing.result !== null) {
        gathered[1] += pairing.result;
        gathered[2] += 1 - pairing.result;
      }
      return gathered;
    }, [[], 0, 0]);
    setAwayTeamScore(awayTeamScore);
    setHomeTeamScore(homeTeamScore);
    setPairings(parsedPairings);
  };
  useEffect(() => {
    socket.emit('pairing:list', currentMatchId);
    socket.on('pairing:listed', loadPairings);
    return () => {
      socket.off('pairing:listed', loadPairings);
    };
  }, []);

  const requestPairingList = (data) => {
    if (data.matchId && data.matchId !== currentMatchId) {
      return;
    }
    socket.emit('pairing:list', currentMatchId);
  };
  useEffect(() => {
    socket.on('member:updated', requestPairingList);
    socket.on('opponent:updated', requestPairingList);
    socket.on('pairing:updated', requestPairingList);
    socket.on('player:selected', requestPairingList);
    return () => {
      socket.off('member:updated', requestPairingList);
      socket.off('opponent:updated', requestPairingList);
      socket.off('pairing:updated', requestPairingList);
      socket.off('player:selected', requestPairingList);
    };
  });

  const hostIcons = [
    match.hostInstagram ? 'instagram' : false,
    match.hostTwitter ? 'twitter' : false,
    match.hostTwitch ? 'twitch' : false
  ].filter(item => item);

  const opponentName = match.opponent
    ? STATE_LOOKUP[match.opponent]
    : false;

  return (
    <Router>
      <div className="App">
        <Switch>
          <Route path="/board/:boardNumber">
            <IndividualBoard pairings={pairings} socket={socket}/>
          </Route>
          <Route path="/">
            {pairings.map((item, i) => {
              return <Board
                key={i + 1}
                board={i + 1}
                name={item.name}
                rating={item.rating}
                pairings={item.pairings}
                socket={socket}
              />;
            })}
          </Route>
        </Switch>
        <Score
          homeTeamName={teamName}
          homeTeamScore={homeTeamScore}
          awayTeamName={opponentName}
          awayTeamScore={awayTeamScore}
        />
        <TitleBar homeTeamName={teamName} awayTeamName={opponentName} name={match.hostName} icons={hostIcons}/>
      </div>
    </Router>
  );
}

export default App;
