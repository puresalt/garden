import React, {useEffect, useState} from 'react';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';

function Settings(props) {
  const {stateList, socketEvent} = props;
  const [selectedState, setSelectedState] = useState(props.selectedState || '');

  const checkForStateChange = (data) => {
    if (data.state) {
      setSelectedState(data.state);
    }
  };

  useEffect(() => {
    socketEvent.on('input', checkForStateChange);
    return () => socketEvent.off('input', checkForStateChange);
  });

  const handleTeamSelect = (event) => {
    const newSelectedState = event.target.value;
    if (event.target.value === selectedState) {
      return;
    }
    setSelectedState(newSelectedState);
    socketEvent.emit('input', {state: newSelectedState});
  };

  return <fieldset className="form-group mt-2">
    <Form.Row>
      <Col xs={6}><Form>
        <Form.Group controlId="opponent">
          <Form.Label>Opponent</Form.Label>
          <Form.Control as="select" custom
                        onChange={handleTeamSelect}>
            {Object.keys(stateList).map((key, i) => <option selected={selectedState === key} key={i}
                                                            value={key}>{stateList[key]}</option>)}
          </Form.Control>
        </Form.Group>
      </Form>
      </Col>
      <Col xs={4}>
        <Form.Control name="host.name" placeholder="Name" value=""/>
      </Col>
    </Form.Row>
  </fieldset>
}

export default Settings;
