import React, {useEffect, useState} from 'react';
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';
import socketIoClient from 'socket.io-client';
import {Config, Data} from 'gscc-common';
import OrDefault from 'gscc-common/react/OrDefault';
import EventEmitter from 'events';
import './App.css';
import Board from './Board';
import Score from './Score';
import TitleBar from './TitleBar';
import IndividualBoard from './IndividualBoard';

const CONFIG = Config(process.env);
const StateLookup = Data.StateLookup;

const socketEvent = new EventEmitter();
const socket = socketIoClient(CONFIG.socketIo.url);
['config', 'results', 'board-1', 'board-2', 'board-3', 'board-4'].forEach(item => socket.on(item, data => socketEvent.emit(item, data)));

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
    socketEvent.on('config', setConfig);
    socketEvent.on('results', setResults);
    return () => {
      socketEvent.off('config', setConfig);
      socketEvent.off('results', setResults);
    };
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
            <IndividualBoard results={results} socketEvent={socketEvent}/>
          </Route>
          <Route path="/">
            {results.map((item, i) => {
              return <Board
                key={i + 1}
                board={i + 1}
                player={item.player}
                rating={item.rating}
                pairings={item.pairings}
                socketEvent={socketEvent}
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
          <div className="MatchName">States Chess Cup: <span><OrDefault
            value={homeTeamName}/></span> vs <span><OrDefault
            value={awayTeamName}/></span></div>
          <TitleBar homeTeam={homeTeamName} awayTeam={homeTeamName} name={hostName} icons={hostIcons}/>
        </div>
      </div>
    </Router>
  );
}

export default App;
