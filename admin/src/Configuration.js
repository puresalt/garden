import React, { useEffect, useState } from 'react';
import Form from 'react-bootstrap/Form';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import ToggleButton from 'react-bootstrap/ToggleButton';
import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';
import Card from 'react-bootstrap/Card';
import LoadingOverlay from 'react-loading-overlay';
import LoadingOverlayText from './LoadingOverlayText';
import './Configuration.css';

function Settings(props) {
  const {socket} = props;

  const [isLoading, setIsLoading] = useState(true);
  const [configurationData, setConfigurationhData] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const updateConfiguration = (key, value) => {
    if (value === configurationData[key]) {
      return;
    }
    setConfigurationhData({
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

  useEffect(() => {
    const handleConfigurationLoad = (data) => {
      setIsLoading(false);
      setConfigurationhData(data);
    };
    socket.emit('configuration:load');
    socket.on('configuration:loaded', handleConfigurationLoad);
    return () => {
      socket.off('configuration:loaded', handleConfigurationLoad);
    };
  }, [socket]);

  return <div className="Settings">
    <LoadingOverlay active={isLoading} spinner={false} text={<LoadingOverlayText/>}>
      <Form onSubmit={handleSubmit}>
        <Card>
          <Card.Header>
            Configuration
          </Card.Header>
          <Card.Body>
            <Form.Group controlId="bottom-left-text">
              <Form.Label>Bottom Left Text</Form.Label>
              <Form.Control
                placeholder="e.g. Garden State Passers"
                type="text"
                value={configurationData.bottomLeftText}
                onChange={(event) => updateConfiguration('bottomLeftText', event.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="bottom-middle-text">
              <Form.Label>Bottom Middle Text</Form.Label>
              <Form.Control
                placeholder="e.g. US Amateur Team East 2021"
                type="text"
                value={configurationData.bottomMiddleText}
                onChange={(event) => updateConfiguration('bottomMiddleText', event.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="bottom-right-text">
              <Form.Label>Bottom Right Text</Form.Label>
              <Form.Control
                placeholder="e.g. <strong>Host:</strong> YourBoyKandy!"
                type="text"
                value={configurationData.bottomRightText}
                onChange={(event) => updateConfiguration('bottomRightText', event.target.value)}
              />
            </Form.Group>
            <fieldset className="form-group">
              <legend className="form-label">Display On Stream</legend>
              <ToggleOption
                name="Programmatic Chess Boards"
                checked={configurationData.showProgrammaticBoards}
                onChange={(value) => updateConfiguration('showProgrammaticBoards', value)}
              />
              <ToggleOption
                name="Show Match Score"
                checked={configurationData.showMatchScore}
                onChange={(value) => updateConfiguration('showMatchScore', value)}
              />
              <ToggleOption
                name="Webcam Holder"
                checked={configurationData.showWebcam}
                onChange={(value) => updateConfiguration('showWebcam', value)}
              />
              <ToggleOption
                name="Ad Block Unit"
                checked={configurationData.showAdUnit}
                onChange={(value) => updateConfiguration('showAdUnit', value)}
              />
            </fieldset>
          </Card.Body>
          <Card.Footer>
            <Button type="submit" disabled={!hasChanges}>Update</Button>
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
