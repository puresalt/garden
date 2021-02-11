import React, { useEffect, useState } from 'react';
import Score from './Score';
import Webcam from './Webcam';
import TitleBar from './TitleBar';
import AdUnit from './AdUnit';
import Pairings from './Pairings';
import './Match.css';
import Board from './Board';

function Match(props) {
  const {currentBoardNumber, currentMatchId, socket} = props;

  const [awayTeamName, setAwayTeamName] = useState('');
  const [awayTeamScore, setAwayTeamScore] = useState(0);
  const [homeTeamName, setHomeTeamName] = useState('');
  const [homeTeamScore, setHomeTeamScore] = useState(0);

  const [pairingList, setPairingList] = useState([]);

  const [configurationData, setConfigurationData] = useState({});
  const loadConfiguration = (incomingConfiguration) => {
    setConfigurationData(incomingConfiguration);
  };

  const loadStream = (incomingStreamData) => {
    setAwayTeamName(incomingStreamData.away);
    setHomeTeamName(incomingStreamData.home);
  };
  const loadBoardList = (incomingBoardList) => {
    setPairingList(incomingBoardList);
  };
  useEffect(() => {
    socket.emit('configuration:load');
    socket.emit('stream:load');
    socket.emit('stream:board:list');
    socket.on('configuration:loaded', loadConfiguration);
    socket.on('stream:loaded', loadStream);
    socket.on('stream:board:listed', loadBoardList);
    return () => {
      socket.off('configuration:loaded', loadConfiguration);
      socket.off('stream:loaded', loadStream);
      socket.off('pairing:listed', loadBoardList);
    };
  }, [currentMatchId, currentBoardNumber]);

  return (
    <div className="Match">
      <Pairings
        pairings={pairingList}
        showProgrammaticBoards={configurationData.showProgrammaticBoards}
        currentBoardNumber={currentBoardNumber}
        socket={socket}
      />
      {configurationData.showMatchScore ? <Score
        homeTeamName={homeTeamName}
        awayTeamName={awayTeamName}
      /> : <></>}
      <TitleBar
        bottomLeftText={configurationData.bottomLeftText}
        bottomMiddleText={configurationData.bottomMiddleText}
        bottomRightText={configurationData.bottomRightText}
      />
      <AdUnit showAdUnit={configurationData.showAdUnit}/>
      <Webcam showWebcam={configurationData.showWebcam}/>
    </div>
  );
}

export default Match;
