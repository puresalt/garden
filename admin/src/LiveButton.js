import React, {useEffect, useState} from 'react';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import ToggleButton from 'react-bootstrap/ToggleButton';
import './LiveButton.css';

function LiveButton(props) {
  const {socketEvent} = props;
  const [isLive, setIsLive] = useState(props.isLive);

  useEffect(() => {
    socketEvent.on('live', setIsLive);
    return () => {
      socketEvent.off('live', setIsLive);
    };
  }, []);

  const handleLiveClick = (event) => {
    const newIsLive = Number(event.target.value) === 1;
    if (newIsLive === isLive) {
      return;
    }
    setIsLive(newIsLive);
    socketEvent.emit('live', newIsLive);
  };

  return <div className="LiveButton clearfix">
    <div className="label float-left">Stream</div>
    <ButtonGroup toggle className="float-right">
      <ToggleButton
        name="live"
        size="sm"
        checked={isLive}
        type="radio"
        value={1}
        variant={isLive ? 'danger' : 'secondary'}
        onChange={handleLiveClick}
      >On</ToggleButton>
      <ToggleButton
        name="live"
        size="sm"
        type="radio"
        checked={!isLive}
        value={0}
        variant={!isLive ? 'danger' : 'secondary'}
        onChange={handleLiveClick}
      >Off</ToggleButton>
    </ButtonGroup>
  </div>;
}

export default LiveButton;
