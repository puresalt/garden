import React, {useState} from 'react';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';

function GameIdForm(props) {
  const {pairingIndex, currentGameId, size, updateGameId, isNotReady} = props;

  const [newGameId, setNewGameId] = useState('');
  const [hasChangedGameId, setHasChangedGameId] = useState(false);
  const handleGameIdChange = (event) => {
    setHasChangedGameId(true);
    setNewGameId(event.target.value);
  };
  const handleGameIdSubmit = (event) => {
    event.preventDefault();
    updateGameId(pairingIndex, newGameId);
    setHasChangedGameId(false);
  };

  return <Form onSubmit={handleGameIdSubmit} disabled={isNotReady}>
    <InputGroup>
      <Form.Control
        placeholder="Lichess.org Game ID"
        type="text"
        size={size}
        defaultValue={currentGameId}
        onChange={handleGameIdChange}
      />
      <InputGroup.Append>
        <Button type="submit" size={size} variant="primary" disabled={isNotReady || !hasChangedGameId}>Set</Button>
      </InputGroup.Append>
    </InputGroup>
  </Form>;
}

export default GameIdForm;
