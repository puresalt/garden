import React from 'react';
import './ScratchBoard.css';

function ScratchBoard(props) {
  const {showScratchBoard, large} = props;
  return (
    showScratchBoard
      ? <div className={`ScratchBoard${large ? ' Large': ''}`}>
        <div className="scratchBoard-placeholder"/>
      </div>
      : <></>
  );
}

export default ScratchBoard;
