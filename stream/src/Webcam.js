import React from 'react';
import './Webcam.css';

function Webcam(props) {
  const {showWebcam, large} = props;
  return (
    showWebcam
      ? <div className={`Webcam${large ? ' Large' : ''}`}>
        <div className="webcam-placeholder"/>
        <div className="webcam-placeholder"/>
      </div>
      : <></>
  );
}

export default Webcam;
