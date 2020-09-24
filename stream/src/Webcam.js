import React from 'react';
import './Webcam.css';
import DebugInfo from './DebugInfo';

function Webcam(props) {
  const {showWebcam, debugMode} = props;
  return (
    showWebcam ? <div className={`Webcam${debugMode ? ' debug' : ''}`}>
      <div className="webcam-placeholder">
        <DebugInfo left={1440} top={743} height={242} width={430}/>
      </div>
    </div> : <></>
  );
}

export default Webcam;
