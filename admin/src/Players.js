import React, {useEffect, useState} from 'react';
import DataObjectParser from 'dataobject-parser';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import OrDefault from 'gscc-common/react/OrDefault';
import LoadingOverlay from 'react-loading-overlay';
import LoadingOverlayText from './LoadingOverlayText';

const boardNumbers = [0, 1, 2, 3];

function Players(props) {
  const {stateLookup, socket, currentMatchId, currentOpponent} = props;

  return <div className="Players">
    <h4>Players</h4>
    <PlayerForm
      team="player"
      socket={socket}
      teamName=" Garden State Chess Club"
      currentMatchId={currentMatchId}
    />
    <hr/>
    <PlayerForm
      team="opponent"
      socket={socket}
      teamName={currentOpponent ? stateLookup[currentOpponent] : ''}
      currentMatchId={currentMatchId}
    />
  </div>;
}

function PlayerForm(props) {
  const {socket, team, currentMatchId, teamName} = props;

  const [isLoading, setIsLoading] = useState(true);
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
    socket.emit('match:player:update', Object.keys(data).reduce((gathered, key) => {
      gathered.set(key, data[key]);
      return gathered;
    }, new DataObjectParser()).data());
    setHasChanges(false);
  };

  const checkForPlayerChanges = (incomingData) => {
    if (incomingData.id !== currentMatchId) {
      return;
    }
    setIsLoading(false);
    const returnedData = {...data, ...(DataObjectParser.untranspose(incomingData))};
    console.log('returnedData', returnedData);
    setData(returnedData);
  };

  useEffect(() => {
    socket.emit('match:player:list', currentMatchId);
    socket.on('match:player:updated', checkForPlayerChanges);
    socket.on('match:player:listed', checkForPlayerChanges);
    return () => {
      socket.off('match:player:listed', checkForPlayerChanges);
      socket.off('match:player:updated', checkForPlayerChanges);
    };
  }, []);

  return <LoadingOverlay active={isLoading} text={<LoadingOverlayText/>} spinner={false}>
    <Form onSubmit={processChanges}>
      <OrDefault value={teamName}/>
      <fieldset className="form-group pt-2">
        {boardNumbers.map(i => {
          return <Form.Row key={i} className="pt-2">
            <Col xs={5}>
              <Form.Control
                name={`${team}[${i}].name`}
                placeholder={'Board ' + (i + 1)}
                type="text"
                value={data[`${team}[${i}].name`] || ''}
                onChange={handleInput}
              />
            </Col>
            <Col xs={4}>
              <Form.Control
                name={`${team}[${i}].username`}
                placeholder="Username"
                type="text"
                value={data[`${team}[${i}].username`] || ''}
                onChange={handleInput}
              />
            </Col>
            <Col xs={3}>
              <Form.Control
                name={`${team}[${i}].rating`}
                placeholder="Rating"
                type="number"
                min={0}
                max={3000}
                value={data[`${team}[${i}].rating`] || ''}
                onChange={handleInput}
              />
            </Col>
          </Form.Row>
        })}
      </fieldset>
      <Button type="submit" disabled={!hasChanges}>Save</Button>
    </Form>
  </LoadingOverlay>
}

export default Players;
