import React, {useEffect, useState} from 'react';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import ToggleButton from 'react-bootstrap/ToggleButton';
import './LiveButton.css';
import InputGroup from 'react-bootstrap/InputGroup';

function LiveButton(props) {
  const {socket, currentMatchId, isLive, updateSetIsLive} = props;

  const [currentIsLive, setIsLive] = useState(isLive);
  const streamUpdated = (data) => {
    if (data.matchId !== currentMatchId) {
      return;
    }
    setIsLive(data.isLive);
    updateSetIsLive(data.isLive);
  };
  useEffect(() => {
    socket.emit('stream:load', currentMatchId);
    socket.on('stream:loaded', streamUpdated);
    socket.on('stream:updated', streamUpdated);
    return () => {
      socket.off('stream:loaded', streamUpdated);
      socket.off('stream:updated', streamUpdated);
    };
  }, []);

  const handleLiveClick = (event) => {
    const newIsLive = event.target.value === '1';
    setIsLive(newIsLive);
    updateSetIsLive(newIsLive);
    socket.emit('stream:update', {matchId: currentMatchId, isLive: newIsLive});
  };

  return <div className="LiveButton clearfix">
    <InputGroup>
      <InputGroup.Prepend>Stream</InputGroup.Prepend>
      <ButtonGroup toggle className="float-right">
        <ToggleButton
          name="live"
          checked={isLive}
          type="radio"
          value={1}
          variant={currentIsLive ? 'danger' : 'secondary'}
          onChange={handleLiveClick}
        >On</ToggleButton>
        <ToggleButton
          name="live"
          type="radio"
          checked={!currentIsLive}
          value={0}
          variant={!currentIsLive ? 'danger' : 'secondary'}
          onChange={handleLiveClick}
        >Off</ToggleButton>
      </ButtonGroup>
    </InputGroup>
  </div>;
}

export default LiveButton;
