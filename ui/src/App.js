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

  return <Matches
    configurationData={configurationData}
    firstMatchData={firstMatchData}
    secondMatchData={secondMatchData}
    isLive={isLive}
    observingMatch={observingMatch}
    observingGame={observingGame}
    examiningGame={examiningGame}
    socket={socket}
  />;
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
