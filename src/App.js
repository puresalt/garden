import React, {useEffect, useState} from 'react';
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';
import socketIoClient from 'socket.io-client';
import './App.css';
import StateLookup from './data/stateLookup';
import EventEmitter from 'events';
import Host from './Host';
import Score from './Score';
import Board from './Board';
import IndividualBoard from './IndividualBoard';
import Tbd from './Tbd';

const socketEvent = new EventEmitter();
const socket = socketIoClient('http://127.0.0.1:4001');
socket.on('config', data => socketEvent.emit('config', data));
socket.on('results', data => socketEvent.emit('results', data));

const MISSING_CONFIG = {
  host: null,
  hostIcons: [],
  home: null,
  away: null
};
Object.freeze(MISSING_CONFIG);
const MISSING_RESULTS = [];
Object.freeze(MISSING_RESULTS);

function App() {
  const [results, setResults] = useState(MISSING_RESULTS);
  const [config, setConfig] = useState(MISSING_CONFIG);

  useEffect(() => {
    socketEvent.on('config', data => setConfig(data));
    socketEvent.on('results', data => setResults(data));
  }, []);

  const hostName = config.host;
  const hostIcons = config.hostIcons;
  const homeTeamName = StateLookup[config.home];
  const awayTeamName = StateLookup[config.away];

  const {homeTeamScore, awayTeamScore} = results
    .filter(item => item.pairings.length)
    .reduce((gathered, item) => {
      const calculatedResults = item.pairings
        .filter(item => item.result !== null)
        .reduce((innerGathered, innerItem) => {
          innerGathered.homeTeamScore += innerItem.result;
          innerGathered.awayTeamScore += 1 - innerItem.result;
          return innerGathered;
        }, {homeTeamScore: 0, awayTeamScore: 0});
      gathered.homeTeamScore += calculatedResults.homeTeamScore;
      gathered.awayTeamScore += calculatedResults.awayTeamScore;
      return gathered;
    }, {homeTeamScore: 0, awayTeamScore: 0});

  return (
    <Router>
      <div className="App">
        <Switch>
          <Route path="/board/:boardNumber">
            <IndividualBoard results={results}/>
          </Route>
          <Route path="/">
            {results.map((item, i) => {
              return <Board
                key={i + 1}
                board={i + 1}
                player={item.player}
                rating={item.rating}
                pairings={item.pairings}
              />;
            })}
          </Route>
        </Switch>
        <Score
          homeTeamName={homeTeamName}
          homeTeamScore={homeTeamScore}
          awayTeamName={awayTeamName}
          awayTeamScore={awayTeamScore}
        />
        <div className="TitleBar">
          <div className="TeamName"><span>Garden State</span> Chess Club</div>
          <div className="MatchName">States Chess Cup: <span><Tbd value={homeTeamName}/></span> vs <span><Tbd
            value={awayTeamName}/></span></div>
          <Host name={hostName} icons={hostIcons}/>
        </div>
      </div>
    </Router>
  );
}

export default App;
