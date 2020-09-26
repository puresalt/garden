import React, {useEffect, useState} from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import ratingSort from 'gscc-common/src/ratingSort';
import Players from './Players';
import Settings from './Settings';
import Table from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form';
import ToggleButton from 'react-bootstrap/ToggleButton';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Button from 'react-bootstrap/Button';

function Dashboard(props) {
  const {socket, stateLookup, currentMatchId, currentOpponent, updateCurrentOpponent} = props;

  const handleSubmit = (data) => {
    socket.emit('match:update', {id: currentMatchId, ...data});
  };

  const [opponents, setOpponents] = useState([]);
  const updateOpponents = (newOpponents) => {
    if (newOpponents.matchId === currentMatchId) {
      setOpponents(newOpponents.opponents);
    }
  };
  const handleOpponentSubmit = (newOpponents) => {
    newOpponents.forEach((newOpponent) => {
      opponents.forEach((opponent, i) => {
        if (newOpponent.id === opponent.id) {
          opponents[i] = {...opponent, ...newOpponent};
        }
      });
    });
    opponents.sort(ratingSort);
    setOpponents(opponents);
    socket.emit('opponent:update', {matchId: currentMatchId, opponents: opponents});
  };
  useEffect(() => {
    socket.emit('opponent:list', currentMatchId);
    socket.on('opponent:listed', updateOpponents);
    socket.on('opponent:updated', updateOpponents);
    return () => {
      socket.off('opponent:listed', updateOpponents);
      socket.off('opponent:updated', updateOpponents);
    }
  }, []);

  return <div className="Dashboard">
    <Row>
      <Col xs={4}>
        <Settings
          currentMatchId={currentMatchId}
          currentOpponent={currentOpponent}
          updateCurrentOpponent={updateCurrentOpponent}
          onSubmit={handleSubmit}
          socket={socket}
          stateLookup={stateLookup}
        />
      </Col>
      <Col>
        <Players
          players={opponents}
          showAverage={true}
          onSubmit={handleOpponentSubmit}
          teamName={currentOpponent ? stateLookup[currentOpponent] : ''}
        />
        <hr/>
        <PlayerSelectionForm
          socket={socket}
          currentMatchId={currentMatchId}
        />
      </Col>
    </Row>
  </div>;
}

function PlayerSelectionForm(props) {
  const {socket, currentMatchId} = props;

  const [hasChanges, setHasChanges] = useState(false);
  const [average, setAverage] = useState(null);
  const [remaining, setRemaining] = useState(8799);
  const setAggregateData = (players) => {
    if (!players.length) {
      return;
    }
    const ratingSum = players.reduce((gathered, item) => gathered + item.rating, 0);
    setAverage((Math.round(ratingSum / players.length) * 100) / 100);
    setRemaining(8799 - ratingSum);
  };
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const updateSelectedPlayers = (newSelectedPlayers) => {
    if (newSelectedPlayers === null) {
      return;
    }
    setAggregateData(newSelectedPlayers);
    setSelectedPlayers(newSelectedPlayers);
  };
  const [players, setPlayers] = useState([]);
  const updatePlayers = (newPlayers) => {
    setPlayers(newPlayers.players);
    const selectedPlayers = newPlayers.players.reduce((gathered, player) => {
      if (player.selected) {
        gathered.push(player.id);
      }
      return gathered;
    }, []);
    setSelectedPlayers(selectedPlayers);
    setAggregateData(newPlayers.players.filter(player => selectedPlayers.indexOf(player.id) > -1));
    setHasChanges(false);
  };
  useEffect(() => {
    socket.emit('player:list', currentMatchId);
    socket.on('player:listed', updatePlayers);
    socket.on('player:selected', updateSelectedPlayers);
    return () => {
      socket.off('player:listed', updatePlayers);
      socket.off('player:selected', updateSelectedPlayers);
    }
  }, []);

  const handleSelection = (playerId, selected) => {
    const inSelectedPlayers = selectedPlayers.indexOf(playerId) > -1;
    let newPlayerList = null;
    if (selected && !inSelectedPlayers) {
      setHasChanges(true);
      newPlayerList = selectedPlayers.concat(playerId).slice(-4);
    } else if (!selected && inSelectedPlayers) {
      setHasChanges(true);
      newPlayerList = selectedPlayers.filter(item => item !== playerId);
    }
    if (newPlayerList === null) {
      return;
    }
    setAggregateData(players.filter(player => newPlayerList.indexOf(player.id) > -1));
    setSelectedPlayers(newPlayerList);
  };

  const processChanges = (event) => {
    event.preventDefault();
    socket.emit('player:select', {matchId: currentMatchId, players: selectedPlayers});
    setHasChanges(false);
  };

  const isDisabled = selectedPlayers.length >= 4;
  return <div className="PlayerSelect">
    <h4>Select Players</h4>
    <Form onSubmit={processChanges}>
      <Table className="table-hover">
        <thead>
        <tr>
          <th scope="col">Playing</th>
          <th scope="col">Name</th>
          <th scope="col">Lichess Handle</th>
          <th scope="col">Rating</th>
        </tr>
        </thead>
        <tbody>
        {players.map((player, i) => {
          const isSelected = selectedPlayers.indexOf(player.id) > -1;
          return <tr key={player.id}>
            <td className="text-left"><ButtonGroup toggle className="float-right">
              <ToggleButton
                name={`selected-${i}`}
                type="radio"
                disabled={isDisabled && !isSelected}
                variant={isSelected ? 'success' : 'secondary'}
                onChange={() => handleSelection(player.id, true)}
              >Yes</ToggleButton>
              <ToggleButton
                name={`selected-${i}`}
                type="radio"
                checked={!isSelected}
                disabled={isDisabled && !isSelected}
                variant={!isSelected ? 'danger' : 'secondary'}
                onChange={() => handleSelection(player.id, false)}
              >No</ToggleButton>
            </ButtonGroup></td>
            <td>{player.name}</td>
            <td>{player.lichessHandle}</td>
            <td className="text-right">{player.rating}</td>
          </tr>
        })}
        </tbody>
        <tfoot>
        <tr className={average >= 2200 ? 'table-danger' : ''}>
          <th colSpan={3} scope="row">Team Average:</th>
          <td>{average === null ? <em>N/A</em> : average}</td>
        </tr>
        <tr>
          <th colSpan={3} scope="row">Points Remaining:</th>
          <td>{remaining}</td>
        </tr>
        </tfoot>
      </Table>
      <Button type="submit" disabled={!hasChanges || average >= 2200}>Save</Button>
    </Form>
  </div>;
}

export default Dashboard;
