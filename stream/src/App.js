import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Switch, useParams } from 'react-router-dom';
import socketIoClient from 'socket.io-client';
import { Config } from 'garden-common';
import Matches from './Matches';
import Match from './Match';
import Manual from './Manual';

const CONFIG = Config(process.env);
const socket = socketIoClient(CONFIG.socketIo.url, {
  path: '/admin'
});

function App() {
  const [configurationData, setConfigurationData] = useState({});
  const loadConfiguration = (incomingConfiguration) => {
    setConfigurationData(incomingConfiguration);
  };

  const [firstMatchData, setFirstMatchData] = useState(null);
  const [secondMatchData, setSecondMatchData] = useState(null);
  const loadMatchList = (incomingMatchData) => {
    setFirstMatchData(incomingMatchData[0]);
    setSecondMatchData(incomingMatchData[1]);
  };

  const [isLive, setIsLive] = useState(false);
  const [observingMatch, setObservingMatch] = useState(0);
  const [observingGame, setObservingGame] = useState(0);
  const [examiningGame, setExaminingGame] = useState(0);
  const loadStream = (incomingStreamData) => {
    if (typeof incomingStreamData.isLive !== 'undefined') {
      setIsLive(incomingStreamData.isLive);
    }
    if (typeof incomingStreamData.matchId !== 'undefined') {
      setObservingMatch(incomingStreamData.matchId);
    }
    if (typeof incomingStreamData.gameId !== 'undefined') {
      setObservingGame(incomingStreamData.gameId);
    }
    if (typeof incomingStreamData.examineId !== 'undefined') {
      setExaminingGame(incomingStreamData.examineId);
    }
  };

  useEffect(() => {
    socket.on('configuration:loaded', loadConfiguration);
    socket.emit('configuration:load');
    socket.on('match:listed', loadMatchList);
    socket.emit('match:list');
    socket.on('stream:loaded', loadStream);
    socket.emit('stream:load');
    return () => {
      socket.off('configuration:loaded', loadConfiguration);
      socket.off('match:listed', loadMatchList);
      socket.off('stream:loaded', loadStream);
    };
  }, []);

  return <Router>
    <Switch>
      <Route exact path="/manual/on">
        <Manual isLive={true} configurationData={configurationData}/>
      </Route>
      <Route exact path="/manual/off">
        <Manual isLive={false} configurationData={configurationData}/>
      </Route>
      <Route exact path="/manual">
        <Manual isLive={isLive} configurationData={configurationData}/>
      </Route>
      <Route path="/match/:matchId/:boardId">
        <ParseRoute
          firstMatchData={firstMatchData}
          secondMatchData={secondMatchData}
          socket={socket}
        />
      </Route>
      <Route path="/">
        <Matches
          configurationData={configurationData}
          firstMatchData={firstMatchData}
          secondMatchData={secondMatchData}
          isLive={isLive}
          observingMatch={observingMatch}
          observingGame={observingGame}
          examiningGame={examiningGame}
          socket={socket}
        />
      </Route>
    </Switch>
  </Router>;
}

function ParseRoute(props) {
  const {firstMatchData, secondMatchData} = props;
  const {matchId, boardId} = useParams();
  const requestedMatchId = matchId
    ? parseInt(matchId)
    : 1;
  const requestedBoardId = boardId
    ? parseInt(boardId)
    : 0;

  return <div className={'Matches'}>
    <div className={`match ${requestedMatchId === 1 ? 'fadeIn' : 'fadeOut'}`}>
      {firstMatchData
        ? <Match
          isLive={true}
          observingMatch={requestedMatchId}
          observingGame={requestedBoardId}
          matchData={firstMatchData}
          showProgrammaticBoards={false}
          socket={socket}
        />
        : ''}
    </div>
    <div className={`match ${requestedMatchId === 2 ? 'fadeIn' : 'fadeOut'}`}>
      {secondMatchData
        ? <Match
          isLive={true}
          observingMatch={requestedMatchId}
          observingGame={requestedBoardId ? requestedBoardId + 4 : 0}
          matchData={secondMatchData}
          showProgrammaticBoards={false}
          socket={socket}
        />
        : ''}
    </div>
  </div>;
}

export default App;
