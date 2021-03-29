import React from 'react';
import Chessboard from 'garden-common/react/Chessboard';
import './ScratchBoard.css';

function ScratchBoard(props) {
  const {showScratchBoard, observingGame, examiningGame, socket} = props;

  const boardId = examiningGame
    ? (examiningGame % 4) || 4
    : 1;

  return (
    showScratchBoard
      ? <div className={`ScratchBoard ${observingGame ? 'Right' : 'Center'} scratch-board-${boardId}`}>
        <Chessboard
          boardName={'board:examine'}
          viewOnly={true}
          viewer={true}
          coordinates={false}
          orientation={!examiningGame || (examiningGame % 2 === 1) ? 'home' : 'away'}
          socket={socket}
        />
      </div>
      : <></>
  );
}

export default ScratchBoard;
