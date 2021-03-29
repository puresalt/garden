import React, { useState } from 'react';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';

function ObserverSeekForm(props) {
  const {id, seek, updateSeek} = props;

  const [newSeek, setNewSeek] = useState(seek);
  const [seekChanged, setSeekChanged] = useState(false);
  const handleChange = (event) => {
    setSeekChanged(true);
    setNewSeek(event.target.value.toLowerCase());
  };
  const handleSubmit = (event) => {
    event.preventDefault();
    if (!seekChanged) {
      return;
    }
    updateSeek(id, newSeek);
    setSeekChanged(false);
  };

  return <Form onSubmit={handleSubmit}>
    <InputGroup>
      <Form.Control
        placeholder="Seek Data"
        type="text"
        defaultValue={seek}
        onChange={handleChange}
      />
      <InputGroup.Append>
        <Button
          type="submit"
          variant="primary"
          disabled={!seekChanged}>Set</Button>
      </InputGroup.Append>
    </InputGroup>
  </Form>;
}

export default ObserverSeekForm;
