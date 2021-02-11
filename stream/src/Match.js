import React, { useEffect, useState } from 'react';
import Score from './Score';
import Webcam from './Webcam';
import TitleBar from './TitleBar';
import AdUnit from './AdUnit';
import Pairings from './Pairings';
import './Match.css';

function Match(props) {
  const {currentBoardNumber, currentMatchId, socket} = props;

  const [awayTeamName, setAwayTeamName] = useState('');
  const [awayTeamScore, setAwayTeamScore] = useState(0);
  const [homeTeamName, setHomeTeamName] = useState('');
  const [homeTeamScore, setHomeTeamScore] = useState(0);

  const [pairings, setPairings] = useState([]);

  const [configurationData, setConfigurationData] = useState({});
  const loadConfiguration = (incomingConfiguration) => {
    setConfigurationData(incomingConfiguration);
  };

  const listMatches = (incomingMatchList) => {
    const match = incomingMatchList[currentMatchId || 0];

    const parsedPairings = [];
    let homeScore = 0;
    let results = 0;
    for (let i = 0, count = 4; i < count; ++i) {
      const result = match.results[i];
      if (result !== null) {
        homeScore = homeScore + result;
        results = results + 1;
      }
      parsedPairings.push({
        home: match.home.players[i],
        away: match.away.players[i],
        result: result,
        orientation: i % 2 !== 0 ? 'white' : 'black'
      });
    }
    const awayScore = results - homeScore;

    setAwayTeamName(match.away.name);
    setAwayTeamScore(awayScore);
    setHomeTeamScore(homeScore);
    setHomeTeamName(match.home.name);
    setPairings(parsedPairings);
  };
  useEffect(() => {
    socket.emit('configuration:load');
    socket.emit('match:list');
    socket.on('configuration:loaded', loadConfiguration);
    socket.on('match:listed', listMatches);
    return () => {
      socket.off('configuration:loaded', loadConfiguration);
      socket.off('match:listed', listMatches);
    };
  }, [currentMatchId, currentBoardNumber]);

  return (
    <div className="Match">
      <Pairings
        pairings={pairings}
        currentBoardNumber={currentBoardNumber}
      />
      {configurationData.showMatchScore ? <Score
        homeTeamName={homeTeamName}
        homeTeamScore={homeTeamScore}
        awayTeamName={awayTeamName}
        awayTeamScore={awayTeamScore}
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
