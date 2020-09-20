import React, {useEffect, useState} from 'react';
import Table from 'react-bootstrap/Table';
import OrDefault from 'gscc-common/react/OrDefault';
import LoadingOverlay from 'react-loading-overlay';
import LoadingOverlayText from './LoadingOverlayText';
import ResultForm from './Pairings/ResultForm';
import GameIdForm from './Pairings/GameIdForm';

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
  useEffect(() => {
    socket.emit('pairing:list', currentMatchId);
    socket.on('pairing:listed', checkForPairingChanges);
    return () => {
      socket.off('pairing:listed', checkForPairingChanges);
    }
  }, [socket]);

  return <div className="Results">
    <LoadingOverlay active={isLoading} spinner={false} text={<LoadingOverlayText/>}>
      <Table className="table-hover">
        <thead>
        <tr>
          <th scope="col">Board</th>
          <th scope="col">Garden State Chess Club</th>
          <th scope="col"><OrDefault value={currentOpponent ? stateLookup[currentOpponent] : ''}/></th>
          <th scope="col">Result</th>
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
              <td colSpan={5}><em>No pairings yet. Please add some players.</em></td>
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

  return <>
    {!(matchUpIndex % 4)
      ? <tr className="table-secondary">
        <th colSpan={5}>Round {(matchUpIndex / 4) + 1}</th>
      </tr>
      : <></>}
    <tr>
      <th scope="row">{matchUpIndex + 1}</th>
      <td><OrDefault value={playerName}/></td>
      <td><OrDefault value={opponentName}/></td>
      <td>
        <ResultForm
          pairingIndex={matchUpIndex}
          result={pairing.result}
          updateResult={updateResult}
          isNotReady={isNotReady}
        />
      </td>
      <td>
        <GameIdForm
          pairingIndex={matchUpIndex}
          gameId={pairing.gameId}
          updateGameId={updateGameId}
          isNotReady={isNotReady}
        />
      </td>
    </tr>
  </>;
}

export default Pairings;
