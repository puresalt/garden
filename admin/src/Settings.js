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

function Settings(props) {
  const {socket, currentMatchId, stateLookup, onSubmit, updateCurrentOpponent} = props;

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
  const [hostInstagram, setHostInstagram] = useState(false);
  const handleHostInstagram = (value) => {
    setHostInstagram(value);
    setHasChanges(true);
  };
  const [hostTwitch, setHostTwitch] = useState(false);
  const handleHostTwitch = (value) => {
    setHostTwitch(value);
    setHasChanges(true);
  };
  const [hostTwitter, setHostTwitter] = useState(false);
  const handleHostTwitter = (value) => {
    setHostTwitter(value);
    setHasChanges(true);
  };

  const [hasChanges, setHasChanges] = useState(false);
  const handleSubmit = (event) => {
    console.log('ready to submit?', opponent);
    event.preventDefault();
    onSubmit({
      opponent: opponent,
      hostName: hostName,
      hostInstagram: hostInstagram,
      hostTwitter: hostTwitter,
      hostTwitch: hostTwitch
    });
    updateCurrentOpponent(opponent);
    setHasChanges(false);
  };

  useEffect(() => {
    if (!currentMatchId) {
      setIsLoading(false);
      return;
    }
    const handleMatchLoad = (data) => {
      if (!data.id) {
        return;
      }
      setIsLoading(false);
      setOpponent(data.opponent);
      setHostName(data.hostName);
      setHostInstagram(data.hostInstagram);
      setHostTwitch(data.hostTwitch);
      setHostTwitter(data.hostTwitter);
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
            {currentMatchId ? `Updating: #${currentMatchId} ${stateLookup[opponent] || 'TBD'}` : 'Add New Match'}
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
              <Icon
                name="instagram"
                checked={hostInstagram}
                onChange={handleHostInstagram}
              />
              <Icon
                name="twitch"
                checked={hostTwitch}
                onChange={handleHostTwitch}
              />
              <Icon
                name="twitter"
                checked={hostTwitter}
                onChange={handleHostTwitter}
              />
            </fieldset>
          </Card.Body>
          <Card.Footer>
            {
              currentMatchId
                ? <Button type="submit" disabled={!hasChanges}>Update</Button>
                : <Button type="submit">Create</Button>
            }
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
    onChange(newIsChecked);
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
