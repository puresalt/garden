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
  const [matchData, setMatchData] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const updateMatchData = (key, value) => {
    if (value === matchData[key]) {
      return;
    }
    setMatchData({
      ...matchData,
      [key]: value
    });
    setHasChanges(true);
  };
  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(matchData);
    setHasChanges(false);
  };

  useEffect(() => {
    if (!currentMatchId) {
      return setIsLoading(false);
    }
    const handleMatchLoad = (data) => {
      if (!data.id) {
        return;
      }
      setIsLoading(false);
      setMatchData(data);
    };
    socket.on('match:loaded', handleMatchLoad);
    return () => {
      socket.off('match:loaded', handleMatchLoad);
    };
  }, [currentMatchId]);

  return <div className="Settings">
    <LoadingOverlay active={isLoading} spinner={false} text={<LoadingOverlayText/>}>
      <Form onSubmit={handleSubmit}>
        <Card>
          <Card.Header>
            {currentMatchId ? `Updating: #${currentMatchId} ${stateLookup[matchData.opponent] || 'TBD'}` : 'Add New Match'}
          </Card.Header>
          <Card.Body>
            <fieldset className="form-group">
              <InputGroup className="host-toggle">
                <ButtonGroup toggle>
                  <ToggleButton
                    type="radio"
                    name="isHome"
                    variant={matchData.isHome ? 'danger' : 'secondary'}
                    checked={matchData.isHome}
                    value={1}
                    onClick={() => updateMatchData('isHome', true)}
                  >
                    Home
                  </ToggleButton>
                  <ToggleButton
                    type="radio"
                    name="isHome"
                    variant={!matchData.isHome ? 'danger' : 'secondary'}
                    checked={!matchData.isHome}
                    value={0}
                    onClick={() => updateMatchData('isHome', false)}
                  >
                    Away
                  </ToggleButton>
                </ButtonGroup>
                <InputGroup.Append>Playing</InputGroup.Append>
              </InputGroup>
            </fieldset>
            <Form.Group controlId="opponent">
              <Form.Label>Opponent</Form.Label>
              <Form.Control
                as="select"
                custom
                onChange={(event) => {
                  const value = event.target.value;
                  updateMatchData('opponent', value);
                  updateCurrentOpponent(value);
                }}
                value={matchData.opponent}>
                {Object.keys(stateLookup).map((key, i) => <option
                  key={i}
                  value={key}>{stateLookup[key]}</option>)}
              </Form.Control>
            </Form.Group>
            <Form.Group controlId="hostName">
              <Form.Label>Host</Form.Label>
              <Form.Control name="hostName" onChange={(event) => updateMatchData('hostName', event.target.value)} placeholder="Name"
                            value={matchData.hostName}/>
            </Form.Group>
            <fieldset className="form-group">
              <legend className="form-label">Social Media Icons</legend>
              <ToggleOption
                icon="instagram"
                name="Instagram"
                checked={matchData.hostInstagram}
                onChange={(value) => updateMatchData('hostInstagram', value)}
              />
              <ToggleOption
                icon="twitch"
                name="Twitch"
                checked={matchData.hostTwitch}
                onChange={(value) => updateMatchData('hostTwitch', value)}
              />
              <ToggleOption
                icon="twitter"
                name="Twitter"
                checked={matchData.hostTwitter}
                onChange={(value) => updateMatchData('hostTwitter', value)}
              />
            </fieldset>
            <fieldset className="form-group">
              <legend className="form-label">Display On Stream</legend>
              <ToggleOption
                name="Webcam Holder"
                checked={matchData.showWebcam}
                onChange={(value) => updateMatchData('showWebcam', value)}
              />
              <ToggleOption
                name="Ad Block Unit"
                checked={matchData.showAdUnit}
                onChange={(value) => updateMatchData('showAdUnit', value)}
              />
              <ToggleOption
                name="Auto Boards"
                checked={matchData.showProgrammaticBoards}
                onChange={(value) => updateMatchData('showProgrammaticBoards', value)}
              />
              <ToggleOption
                name="Debug Info"
                checked={matchData.showDebugInformation}
                onChange={(value) => updateMatchData('showDebugInformation', value)}
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

function ToggleOption(props) {
  const {icon, name, checked, onChange} = props;

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
        name={`toggle-${name}`}
        variant={isChecked ? 'danger' : 'secondary'}
        checked={isChecked}
        value={1}
        onClick={handleIsChecked}
      >
        Show
      </ToggleButton>
      <ToggleButton
        type="radio"
        name={`toggle-${name}`}
        variant={!isChecked ? 'danger' : 'secondary'}
        checked={!isChecked}
        value={0}
        onClick={handleIsChecked}
      >
        Hide
      </ToggleButton>
    </ButtonGroup>
    <InputGroup.Append>{icon ? <><i className={`fab fa-${name}`}/> </> : ''}{name}</InputGroup.Append>
  </InputGroup>;
}

export default Settings;
