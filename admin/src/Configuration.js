import React, { useEffect, useState } from 'react';
import Form from 'react-bootstrap/Form';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import ToggleButton from 'react-bootstrap/ToggleButton';
import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';
import Card from 'react-bootstrap/Card';
import LoadingOverlay from 'react-loading-overlay';
import LoadingOverlayText from './LoadingOverlayText';
import DateTimePicker from 'react-datetime-picker';
import Container from 'react-bootstrap/Container';
import './Configuration.css';

function Settings(props) {
  const {socket} = props;

  const [isLoading, setIsLoading] = useState(true);
  const [configurationData, setConfigurationgData] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const updateConfiguration = (key, value) => {
    if (value === configurationData[key]) {
      return;
    }
    setConfigurationgData({
      ...configurationData,
      [key]: value
    });
    setHasChanges(true);
  };
  const handleSubmit = (event) => {
    event.preventDefault();
    socket.emit('configuration:update', configurationData);
    setHasChanges(false);
  };

  const handleConfigurationLoad = (data) => {
    setIsLoading(false);
    setConfigurationgData({...data, nextRoundStart: new Date(data.nextRoundStart)});
  };

  useEffect(() => {
    socket.emit('configuration:load');
    socket.on('configuration:loaded', handleConfigurationLoad);
    return () => {
      socket.off('configuration:loaded', handleConfigurationLoad);
    };
  }, [socket]);

  return <LoadingOverlay active={isLoading} spinner={false} text={<LoadingOverlayText/>}>
    <div className="Settings">
      <Container className={'p-3'}>
        <Form onSubmit={handleSubmit}>
          <Card>
            <Card.Header>
              Configuration
            </Card.Header>
            <Card.Body>
              <Form.Group controlId="bottom-left-text">
                <Form.Label>Bottom Left Text</Form.Label>
                <Form.Control
                  placeholder="e.g. <span>Featuring:</span> John & Sean"
                  type="text"
                  value={configurationData.bottomLeftText}
                  onChange={(event) => updateConfiguration('bottomLeftText', event.target.value)}
                />
              </Form.Group>
              <Form.Group controlId="bottom-middle-text">
                <Form.Label>Bottom Middle Text</Form.Label>
                <Form.Control
                  placeholder="e.g. <span>Round:</span> 1 of 6"
                  type="text"
                  value={configurationData.bottomMiddleText}
                  onChange={(event) => updateConfiguration('bottomMiddleText', event.target.value)}
                />
              </Form.Group>
              <Form.Group controlId="bottom-right-text">
                <Form.Label>Bottom Right Text</Form.Label>
                <Form.Control
                  placeholder="e.g. <span>Host:</span> YourBoyKandy!"
                  type="text"
                  value={configurationData.bottomRightText}
                  onChange={(event) => updateConfiguration('bottomRightText', event.target.value)}
                />
                <hr/>
              </Form.Group>
              <fieldset className="form-group">
                <legend className="form-label">Display On Stream</legend>
                <ToggleOption
                  name="Programmatic Chess Boards"
                  checked={configurationData.showProgrammaticBoards}
                  onChange={(value) => updateConfiguration('showProgrammaticBoards', value)}
                />
                <ToggleOption
                  name="Scratch Board Holder"
                  checked={configurationData.showScratchBoard}
                  onChange={(value) => updateConfiguration('showScratchBoard', value)}
                />
                <ToggleOption
                  name="Sponsor Block Unit"
                  checked={configurationData.showSponsorUnit}
                  onChange={(value) => updateConfiguration('showSponsorUnit', value)}
                />
              </fieldset>
              <hr/>
              <Form.Group controlId="bottom-right-text">
                <Form.Label>Next Round Start</Form.Label>
                <div className={'form-control p-1'}>
                  <DateTimePicker
                    onChange={(dateTime) => updateConfiguration('nextRoundStart', dateTime)}
                    value={configurationData.nextRoundStart}
                  />
                </div>
              </Form.Group>
            </Card.Body>
            <Card.Footer>
              <Button type="submit" disabled={!hasChanges}>Update</Button>
            </Card.Footer>
          </Card>
        </Form>
      </Container>
    </div>
  </LoadingOverlay>;
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
