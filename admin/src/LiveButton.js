import React, {useEffect, useState} from 'react';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import ToggleButton from 'react-bootstrap/ToggleButton';
import './LiveButton.css';
import InputGroup from 'react-bootstrap/InputGroup';

function LiveButton(props) {
  const {socket} = props;
  
  const [isLive, setIsLive] = useState();
  const updateIsLive = (newIsLive) => {
    setIsLive(newIsLive);
  };
  useEffect(() => {
    socket.on('live', updateIsLive);
    return () => {
      socket.off('live', updateIsLive);
    };
  }, [socket]);

  const handleLiveClick = (event) => {
    const newIsLive = event.target.value === '1';
    setIsLive(newIsLive);
    socket.emit('live', newIsLive);
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
