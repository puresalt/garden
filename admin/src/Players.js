import React, {useState} from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import OrDefault from 'gscc-common/react/OrDefault';

const boardNumbers = [0, 1, 2, 3];

function Players(props) {
  const {opponentName, socketEvent} = props;
  
  

  return <Row>
    <Col xs={5}>
      Garden State Chess Club
      <PlayerForm team="player" socketEvent={socketEvent} isOpponent={false}/>
    </Col>
    <Col xs={{span: 5, offset: 2}}>
      <OrDefault value={opponentName}/>
      <PlayerForm team="enemy" socketEvent={socketEvent} isOpponent={true}/>
    </Col>
  </Row>
}

function PlayerForm(props) {
  const {socketEvent, team} = props;
  const [hasChanges, setHasChanges] = useState(false);

  const [data, setData] = useState(props.data || {});

  const handleInput = (event) => {
    const target = event.target;
    setHasChanges(true);
    setData({
      ...data,
      [target.name]: target.type === 'checkbox'
        ? target.checked
        : target.value
    });
  };

  const processChanges = (event) => {
    event.preventDefault();
    socketEvent.emit('input', data);
    setHasChanges(false);
  };

  return <Form onChange={handleInput} onSubmit={processChanges}>
    <fieldset class="form-group pt-2">
      {boardNumbers.map(i => {
        return <Form.Row key={i} className="pt-2">
          <Col xs={5}>
            <Form.Control name={`${team}.$${i}.name`} placeholder={'Board ' + (i + 1)}
                          value={data[`${team}.$${i}.name`]}
            />
          </Col>
          <Col xs={4}>
            <Form.Control name={`${team}.$${i}.username`} placeholder="Username"
                          value={data[`${team}.$${i}.username`]}/>
          </Col>
          <Col xs={3}>
            <Form.Control name={`${team}.$${i}.rating`} placeholder="Rating" type="number" min={0}
                          max={3000} value={data[`${team}.$${i}.rating`]}/>
          </Col>
        </Form.Row>
      })}
    </fieldset>
    <Button type="submit" disabled={!hasChanges}>Save</Button>
  </Form>
}

export default Players;
