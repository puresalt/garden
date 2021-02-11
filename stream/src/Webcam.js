import React from 'react';
import './Webcam.css';

function Webcam(props) {
  const {showWebcam} = props;
  return (
    showWebcam
      ? <div className="Webcam">
        <div className="webcam-placeholder"/>
      </div>
      : <></>
  );
}

export default Webcam;
