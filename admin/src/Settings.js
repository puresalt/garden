import React, {useEffect, useState} from 'react';
import Form from 'react-bootstrap/Form';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import ToggleButton from 'react-bootstrap/ToggleButton';
import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';
import Card from 'react-bootstrap/Card';
import LoadingOverlay from 'react-loading-overlay';
import LoadingOverlayText from './LoadingOverlayText';
import './Settings.css';

const HOST_ICONS = ['twitter', 'instagram', 'twitch'];

function Settings(props) {
  const {currentMatchId, stateLookup, onSubmit, socket} = props;

  const [isLoading, setIsLoading] = useState(true);
  const [opponent, setOpponent] = useState('');
  const handleOpponent = (event) => {
    setOpponent(event.target.value);
    setHasChanges(true);
  };

  const [hostName, setHostName] = useState('');
  const handleHostName = (event) => {
    setHostName(event.target.value);
    setHasChanges(true);
  };

  const [hostIcons, setHostIcons] = useState([]);
  const handleHostIcon = (icon, checked) => {
    const inHostIcons = hostIcons.indexOf(icon) > -1;
    if (checked && inHostIcons) {
      return;
    }
    if (checked) {
      hostIcons.push(icon);
    } else if (!checked && inHostIcons) {
      hostIcons.splice(hostIcons.indexOf(icon), 1);
    }
    hostIcons.sort();
    setHostIcons(hostIcons);
    setHasChanges(true);
  };

  const [hasChanges, setHasChanges] = useState(false);
  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      opponent: opponent,
      host: {
        name: hostName,
        icons: hostIcons
      }
    });
    setHasChanges(false);
  };

  useEffect(() => {
    socket.emit('match:load', currentMatchId);
  }, [socket, currentMatchId]);

  useEffect(() => {
    if (!currentMatchId) {
      setIsLoading(false);
      return;
    }
    const handleMatchLoad = (data) => {
      setIsLoading(false);
      if (!data.id) {
        return;
      }
      setOpponent(data.opponent);
      setHostIcons(data.host.icons);
      setHostName(data.host.name);
    };
    socket.on('match:loaded', handleMatchLoad);
    return () => {
      socket.off('match:loaded', handleMatchLoad);
    };
  }, []);

  return <div className="Settings">
    <LoadingOverlay active={isLoading} spinner={false} text={<LoadingOverlayText/>}>
      <Form onSubmit={handleSubmit}>
        <Card>
          <Card.Header>
            {currentMatchId ? `Updating: #${currentMatchId} ${stateLookup[opponent] || 'TBD'}` : 'Create New Match'}
          </Card.Header>
          <Card.Body>
            <Form.Group controlId="opponent">
              <Form.Label>Opponent</Form.Label>
              <Form.Control as="select" custom onChange={handleOpponent} value={opponent}>
                {Object.keys(stateLookup).map((key, i) => <option
                  key={i}
                  value={key}>{stateLookup[key]}</option>)}
              </Form.Control>
            </Form.Group>
            <Form.Group controlId="host">
              <Form.Label>Host</Form.Label>
              <Form.Control name="host" onChange={handleHostName} placeholder="Name" value={hostName}/>
            </Form.Group>
            <fieldset className="form-group">
              <legend className="form-label">Social Media Icons</legend>
              {HOST_ICONS.map((icon, i) => {
                return <Icon
                  key={i}
                  name={icon}
                  checked={hostIcons.indexOf(icon) > -1}
                  onChange={handleHostIcon}
                />
              })}
            </fieldset>
          </Card.Body>
          <Card.Footer>
            {currentMatchId ? <Button type="submit" disabled={!hasChanges}>Update</Button> :
              <Button type="submit">Create</Button>}
          </Card.Footer>
        </Card>
      </Form>
    </LoadingOverlay>
  </div>
}

function Icon(props) {
  const {name, checked, onChange} = props;

  const [isChecked, setIsChecked] = useState(false);

  const handleIsChecked = (event) => {
    const newIsChecked = Boolean(Number(event.target.value));
    setIsChecked(newIsChecked);
    onChange(name, newIsChecked);
  };

  useEffect(() => {
    setIsChecked(checked);
  }, [checked]);

  return <InputGroup className="host-toggle">
    <ButtonGroup toggle>
      <ToggleButton
        type="radio"
        name={`hostIcon-${name}`}
        variant={isChecked ? 'danger' : 'secondary'}
        checked={isChecked}
        value={1}
        onClick={handleIsChecked}
      >
        Show
      </ToggleButton>
      <ToggleButton
        type="radio"
        name={`hostIcon-${name}`}
        variant={!isChecked ? 'danger' : 'secondary'}
        checked={!isChecked}
        value={0}
        onClick={handleIsChecked}
      >
        Hide
      </ToggleButton>
    </ButtonGroup>
    <InputGroup.Append><i className={`fab fa-${name}`}/> {name}</InputGroup.Append>
  </InputGroup>;
}

export default Settings;
