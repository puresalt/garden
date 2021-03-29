import React from 'react';
import Countdown from 'react-countdown';
import './LoadingScreen.css';

const showTime = (time, unit) => {
  if (!time) {
    return '';
  }
  return <>{' '}{time}{' '}<small>{unit}{time !== 1 ? 's' : ''}</small></>;
};
const countdownRenderer = ({days, hours, minutes, seconds, completed}) => {
  if (completed) {
    return <>Currently One Break!</>;
  }
  return <>
    <span>Starting:</span>{showTime(days, 'day')}{showTime(hours, 'hour')}{showTime(minutes, 'minute') || <>{' 0 '}<small>minutes</small></>}{showTime(seconds, 'second') || <>{' 0 '}<small>seconds</small></>}
  </>;
}

function LoadingScreen(props) {
  const {isLive, nextRoundStart} = props;

  console.log('nextRoundStart:', nextRoundStart);

  return <div className={`LoadingScreen ${isLive ? 'fadeOut' : 'fadeIn'}`}>
    <div className="bar">
      <div className="left"><Countdown date={new Date(nextRoundStart)} renderer={countdownRenderer}/></div>
      <div className="right"><span>Date:</span> April 3rd & 4th</div>
    </div>
    <div className="hide-middle"/>
  </div>;
}

export default LoadingScreen;
