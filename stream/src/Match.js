import React, {useEffect, useState} from 'react';
import Score from './Score';
import Webcam from './Webcam';
import TitleBar from './TitleBar';
import AdUnit from './AdUnit';
import Pairings from './Pairings';
import './Match.css';

const teamName = 'New Jersey';
const totalBoardNumber = 4;

function Match(props) {
  const {stateLookup, currentBoardNumber, currentMatch, socket} = props;

  const [awayTeamScore, setAwayTeamScore] = useState(0);
  const [homeTeamScore, setHomeTeamScore] = useState(0);
  const [pairings, setPairings] = useState([]);
  const loadPairings = (incomingPairings) => {
    if (incomingPairings.matchId !== currentMatch.id) {
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
    const requestPairingList = (data) => {
      if (data.matchId !== currentMatch.id) {
        return () => {
        };
      }
      socket.emit('pairing:list', currentMatch.id);
    };
    socket.emit('pairing:list', currentMatch.id);
    socket.on('pairing:listed', loadPairings);
    socket.on('member:updated', requestPairingList);
    socket.on('opponent:updated', requestPairingList);
    socket.on('pairing:updated', requestPairingList);
    socket.on('player:selected', requestPairingList);
    return () => {
      socket.off('pairing:listed', loadPairings);
      socket.off('member:updated', requestPairingList);
      socket.off('opponent:updated', requestPairingList);
      socket.off('pairing:updated', requestPairingList);
      socket.off('player:selected', requestPairingList);
    };
  }, [currentMatch.id]);

  const hostIcons = [
    currentMatch.hostInstagram ? 'instagram' : false,
    currentMatch.hostTwitter ? 'twitter' : false,
    currentMatch.hostTwitch ? 'twitch' : false
  ].filter(item => item);

  const opponentName = currentMatch.opponent
    ? stateLookup[currentMatch.opponent]
    : false;

  return (
    <div className="Match">
      <Pairings
        pairings={pairings}
        currentBoardNumber={currentBoardNumber}
        showProgrammaticBoards={currentMatch.showProgrammaticBoards}
        showDebugInformation={currentMatch.showDebugInformation}
        socket={socket}
      />
      <Score
        homeTeamName={teamName}
        homeTeamScore={homeTeamScore}
        awayTeamName={opponentName}
        awayTeamScore={awayTeamScore}
      />
      <TitleBar homeTeamName={teamName} awayTeamName={opponentName} name={currentMatch.hostName} icons={hostIcons}/>
      <AdUnit showAdUnit={currentMatch.showAdUnit} debugMode={currentMatch.showDebugInformation}/>
      <Webcam showWebcam={currentMatch.showWebcam} debugMode={currentMatch.showDebugInformation}/>
    </div>
  );
}

export default Match;
