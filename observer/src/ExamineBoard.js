import React, { useState } from 'react';
import Chessboard from 'garden-common/react/Chessboard';

function ExamineBoard(props) {
  const {pairing, examiningGame, orientation, socket} = props;

  const handleDraw = (drawData) => {
    socket.emit(`board:examine:draw`, {draw: drawData});
  };

  const handleAfter = (fen) => {
    socket.emit(`board:examine:move`, fen);
  };

  return (
    <div className={`Board board-${examiningGame || 0}`} key={pairing} id={'board-examine'}>
      <Chessboard
        key={'board:examine'}
        boardName={'board:examine'}
        size={400}
        orientation={orientation}
        pauseClocks={true}
        onMoveFen={handleAfter}
        draggable={{events: {after: handleAfter}}}
        selectable={{enabled: false}}
        viewOnly={false}
        coordinates={true}
        drawable={{onChange: handleDraw}}
        socket={socket}
      />
    </div>
  );
}

export default ExamineBoard;
