import React, { useEffect, useState } from 'react';
import OrDefault from 'garden-common/react/OrDefault';
import Chessboard from 'garden-common/react/Chessboard';

function Board(props) {
  const {pairing, socket} = props;

  const {board, home, away, orientation} = pairing;

  const size = 320;

  const handleDraw = (drawData) => {
    socket.emit(`board:${board}:draw`, {draw: drawData});
  };

  return (
    <div className="Board" key={board} id={'board-' + board}>
      <header>
        <div className="board-header-home"><OrDefault value={home.name}/></div>
        <div className="board-header-away"><OrDefault value={away.name}/></div>
      </header>
      <Chessboard
        key={'board:' + board}
        boardName={'board:' + board}
        size={size}
        orientation={orientation}
        movable={{enabled: false}}
        draggable={{enabled: false}}
        selectable={{enabled: false}}
        viewOnly={false}
        coordinates={false}
        drawable={{onChange: handleDraw}}
        socket={socket}
      />
    </div>
  );
}

export default Board;
