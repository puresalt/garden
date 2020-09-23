import React, {useEffect, useState} from 'react';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import ToggleButton from 'react-bootstrap/ToggleButton';
import './LiveButton.css';
import InputGroup from 'react-bootstrap/InputGroup';

function LiveButton(props) {
  const {socket, currentMatchId} = props;

  const [isLive, setIsLive] = useState(null);
  const streamUpdated = (data) => {
    if (data.matchId !== currentMatchId) {
      return;
    }
    setIsLive(data.isLive);
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
          variant={isLive ? 'danger' : 'secondary'}
          onChange={handleLiveClick}
        >On</ToggleButton>
        <ToggleButton
          name="live"
          type="radio"
          checked={!isLive}
          value={0}
          variant={!isLive ? 'danger' : 'secondary'}
          onChange={handleLiveClick}
        >Off</ToggleButton>
      </ButtonGroup>
    </InputGroup>
  </div>;
}

export default LiveButton;
