import React, {useEffect, useState} from 'react';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import ToggleButton from 'react-bootstrap/ToggleButton';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import OrDefault from 'gscc-common/react/OrDefault';
import LoadingOverlay from 'react-loading-overlay';
import LoadingOverlayText from './LoadingOverlayText';

const matchUps = [
  [
    [0, 3],
    [1, 2],
    [2, 1],
    [3, 0]
  ],
  [
    [0, 2],
    [1, 3],
    [2, 0],
    [3, 1]
  ],
  [
    [0, 1],
    [1, 0],
    [2, 3],
    [3, 2]
  ],
  [
    [0, 0],
    [1, 1],
    [2, 2],
    [3, 3]
  ]
];

function Results(props) {
  const {socket, stateLookup, currentMatchId, currentOpponent} = props;

  const [isLoading, setIsLoading] = useState(true);
  const [players, setPlayers] = useState([]);
  const [opponents, setOpponents] = useState([]);

  useEffect(() => {
    const checkForPlayerChanges = (data) => {
      if (data.id !== currentMatchId) {
        return;
      }
      setPlayers(data.player);
      setOpponents(data.opponent);
      setIsLoading(false);
    };
    socket.emit('match:player:list', currentMatchId);
    socket.on('match:player:listed', checkForPlayerChanges);
    return () => {
      socket.off('match:player:listed', checkForPlayerChanges);
    }
  }, []);

  const [pairings, setPairingData] = useState({});
  const updatePairingData = (pairingId, value) => {
    setPairingData({
      ...pairings,
      [pairingId]: value
    });
    console.log('match:pairing:update', {[pairingId]: value});
    socket.emit('match:pairing:update', {[pairingId]: value});
  };

  useEffect(() => {
    const checkForPairingChanges = (data) => {
      if (data.id !== currentMatchId) {
        return;
      }
      setPairingData(data.pairings);
    };
    socket.emit('match:pairing:list', currentMatchId);
    socket.on('match:pairing:listed', checkForPairingChanges);
    return () => {
      socket.off('match:pairing:listed', checkForPairingChanges);
    }
  }, []);

  const currentOpponentName = currentOpponent
    ? stateLookup[currentOpponent]
    : '';
  return <div className="Results">
    <LoadingOverlay active={isLoading} spinner={false} text={<LoadingOverlayText/>}>
      <Table className="table-hover">
        <thead>
        <tr>
          <th scope="col">Board</th>
          <th scope="col">Garden State Chess Club</th>
          <th scope="col"><OrDefault value={currentOpponentName}/></th>
          <th scope="col">Result</th>
          <th scope="col">Game</th>
        </tr>
        </thead>
        <tbody>
        {matchUps.map((matchUp, i) => {
          return <Round
            key={i}
            number={i + 1}
            matchUp={matchUp}
            pairings={pairings}
            players={players}
            opponents={opponents}
            updatePairingData={updatePairingData}
          />
        })}
        </tbody>
      </Table>
    </LoadingOverlay>
  </div>;
}

function Round(props) {
  const {number, matchUp, pairings, players, opponents, updatePairingData} = props;

  return <>
    <tr className="table-secondary">
      <th colSpan={5}>Round {number}</th>
    </tr>
    {matchUp.map((tuple, i) => {
        return <MatchUp
          key={i}
          board={i}
          round={number}
          player={players[tuple[0]]}
          pairings={pairings}
          opponent={opponents[tuple[1]]}
          updatePairingData={updatePairingData}
        />;
      }
    )}
  </>;
}

function MatchUp(props) {
  const {board, pairings, round, player, opponent, updatePairingData} = props;

  const pairingName = `result[${board}][${round - 1}]`;
  const gameIdKey = `${pairingName}.gameId`;
  const resultKey = `${pairingName}.result`;

  const [hasChangedGameId, setHasChangedGameId] = useState(false);
  const [result, setResult] = useState(pairings[resultKey] || null);
  const [gameId, setGameId] = useState(pairings[gameIdKey] || '');

  const handleGameIdUpdate = (event) => {
    setHasChangedGameId(true);
    setGameId(event.target.value);
  };
  const updateGameId = (event) => {
    event.preventDefault();
    updatePairingData(gameIdKey, gameId);
    setHasChangedGameId(false);
  };

  const checkResult = (event) => {
    if (event.target.checked && Number(event.target.value) === result) {
      event.target.checked = false;
      updatePairingData(resultKey, null);
      setResult(null);
    }
  };
  const handleResult = (event) => {
    const newResult = Number(event.target.value);
    updatePairingData(resultKey, newResult);
    setResult(newResult);
  };

  const hasPlayer = player && player.name;
  const hasOpponent = opponent && opponent.name;
  const hasResult = result !== null;
  const isWin = hasResult && result === 1;
  const isDraw = hasResult && result === 0.5;
  const isLoss = hasResult && result === 0;

  const playerName = hasPlayer
    ? <>{player.name} <em>({player.rating || '???'})</em></>
    : null;
  const opponentName = hasOpponent
    ? <>{opponent.name} <em>({opponent.rating || '???'})</em></>
    : null;
  const isNotReady = !hasPlayer || !hasOpponent;
  return <tr>
    <th scope="row">{board}</th>
    <td><OrDefault value={playerName}/></td>
    <td><OrDefault value={opponentName}/></td>
    <td>
      <ButtonGroup toggle>
        <ToggleButton
          checked={isWin}
          disabled={isNotReady}
          name={`${pairingName}.result`}
          type="radio"
          value={1}
          onClick={checkResult}
          onChange={handleResult}
          variant={isWin || !hasResult ? "success" : "secondary"}>W</ToggleButton>
        <ToggleButton
          checked={isDraw}
          disabled={isNotReady}
          name={`${pairingName}.result`}
          type="radio"
          value={0.5}
          onClick={checkResult}
          onChange={handleResult}
          variant={isDraw || !hasResult ? "warning" : "secondary"}>D</ToggleButton>
        <ToggleButton
          checked={isLoss}
          disabled={isNotReady}
          name={`${pairingName}.result`}
          type="radio"
          value={0}
          onClick={checkResult}
          onChange={handleResult}
          variant={isLoss || !hasResult ? "danger" : "secondary"}>L</ToggleButton>
      </ButtonGroup>
    </td>
    <td>
      <Form onSubmit={updateGameId} disabled={isNotReady}>
        <InputGroup>
          <Form.Control
            name={`${pairingName}.gameId`}
            placeholder="Lichess.org Game ID"
            type="text"
            onChange={handleGameIdUpdate}
            value={gameId}
          />
          <InputGroup.Append>
            <Button type="submit" variant="primary" disabled={isNotReady || !hasChangedGameId}>Set</Button>
          </InputGroup.Append>
        </InputGroup>
      </Form>
    </td>
  </tr>;
}

export default Results;
