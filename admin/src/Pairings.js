import React, {useEffect, useState} from 'react';
import Table from 'react-bootstrap/Table';
import OrDefault from 'garden-common/react/OrDefault';
import LoadingOverlay from 'react-loading-overlay';
import LoadingOverlayText from './LoadingOverlayText';
import ResultForm from './Pairings/ResultForm';
import GameIdForm from './Pairings/GameIdForm';
import './Pairings.css';

const BOARD_COLORS = [
  'black',
  'black',
  'white',
  'white',
  'white',
  'white',
  'black',
  'black',
  'white',
  'white',
  'black',
  'black',
  'black',
  'black',
  'white',
  'white'
];

function Pairings(props) {
  const {socket, stateLookup, currentMatchId, currentOpponent} = props;

  const [isLoading, setIsLoading] = useState(true);
  const [pairings, setPairings] = useState([]);

  const updateGameId = (pairingIndex, gameId) => {
    const newPairings = pairings.map(item => item);
    newPairings[pairingIndex].gameId = gameId;
    socket.emit('pairing:update', newPairings[pairingIndex]);
    setPairings(newPairings);
  };
  const updateResult = (pairingIndex, result) => {
    const newPairings = pairings.map(item => item);
    newPairings[pairingIndex].result = result;
    socket.emit('pairing:update', newPairings[pairingIndex]);
    setPairings(newPairings);
  };

  const checkForPairingChanges = (data) => {
    if (data.matchId !== currentMatchId) {
      return;
    }
    setPairings(data.pairings);
    setIsLoading(false);
  };
  const requestPairingList = (data) => {
    if (data.matchId !== currentMatchId) {
      return;
    }
    setIsLoading(true);
    socket.emit('pairing:list', currentMatchId);
  };
  useEffect(() => {
    socket.emit('pairing:list', currentMatchId);
    socket.on('pairing:listed', checkForPairingChanges);
    socket.on('pairing:updated', requestPairingList);
    return () => {
      socket.off('pairing:listed', checkForPairingChanges);
      socket.off('pairing:updated', requestPairingList);
    }
  }, [socket]);

  return <div className="Pairings">
    <LoadingOverlay active={isLoading} spinner={false} text={<LoadingOverlayText/>}>
      <Table className="table-hover">
        <thead>
        <tr>
          <th scope="col">Board</th>
          <th scope="col">Garden State Chess Club</th>
          <th/>
          <th scope="col" className="text-center">Result</th>
          <th/>
          <th scope="col"><OrDefault value={currentOpponent ? stateLookup[currentOpponent] : ''}/></th>
          <th scope="col">Game</th>
        </tr>
        </thead>
        <tbody>
        {
          pairings.length
            ? pairings.map((pairing, i) => {
              return <MatchUp
                matchUpIndex={i}
                key={i}
                pairing={pairing}
                updateGameId={updateGameId}
                updateResult={updateResult}
              />;
            })
            : <tr className="table-warning">
              <td colSpan={7}><em>No pairings yet. Please add some players.</em></td>
            </tr>
        }
        </tbody>
      </Table>
    </LoadingOverlay>
  </div>;
}

function MatchUp(props) {
  const {matchUpIndex, pairing, updateGameId, updateResult} = props;

  const hasPlayer = pairing.player.id;
  const hasOpponent = pairing.opponent.id;

  const playerName = hasPlayer
    ? <>{pairing.player.name || pairing.player.username || 'Someone Unnamed'}
      <em>({pairing.player.rating || '???'})</em></>
    : null;
  const opponentName = hasOpponent
    ? <>{pairing.opponent.name || pairing.opponent.username || 'Someone Unnamed'}
      <em>({pairing.opponent.rating || '???'})</em></>
    : null;
  const isNotReady = !hasPlayer || !hasOpponent;

  let homeColor;
  let awayColor;
  if (BOARD_COLORS[matchUpIndex] === 'white') {
    homeColor = <td className="white">W</td>;
    awayColor = <td className="black">B</td>;
  } else {
    homeColor = <td className="black">B</td>;
    awayColor = <td className="white">W</td>;
  }

  return <>
    {!(matchUpIndex % 4)
      ? <tr className="table-secondary">
        <th colSpan={7}>Round {(matchUpIndex / 4) + 1}</th>
      </tr>
      : <></>}
    <tr>
      <th scope="row">{matchUpIndex + 1}</th>
      <td><OrDefault value={playerName}/></td>
      {homeColor}
      <td className="text-center">
        <ResultForm
          pairingIndex={matchUpIndex}
          result={pairing.result}
          updateResult={updateResult}
          isNotReady={isNotReady}
        />
      </td>
      {awayColor}
      <td><OrDefault value={opponentName}/></td>
      <td>
        <GameIdForm
          pairingIndex={matchUpIndex}
          currentGameId={pairing.gameId}
          updateGameId={updateGameId}
          isNotReady={isNotReady}
        />
      </td>
    </tr>
  </>;
}

export default Pairings;
