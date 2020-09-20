import React, {useState} from 'react';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';

function GameIdForm(props) {
  const {gameId, updateGameId, isNotReady, pairingId} = props;

  const [newGameId, setNewGameId] = useState('');
  const [hasChangedGameId, setHasChangedGameId] = useState(false);
  const handleGameIdChange = (event) => {
    setHasChangedGameId(true);
    setNewGameId(event.target.value);
  };
  const handleGameIdSubmit = (event) => {
    event.preventDefault();
    updateGameId(pairingId, newGameId);
    setHasChangedGameId(false);
  };

  return <Form onSubmit={handleGameIdSubmit} disabled={isNotReady}>
    <InputGroup>
      <Form.Control
        placeholder="Lichess.org Game ID"
        type="text"
        onChange={handleGameIdChange}
      />
      <InputGroup.Append>
        <Button type="submit" variant="primary" disabled={isNotReady || !hasChangedGameId}>Set</Button>
      </InputGroup.Append>
    </InputGroup>
  </Form>;
}

export default GameIdForm;
