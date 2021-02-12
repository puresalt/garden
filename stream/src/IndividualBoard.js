import React from 'react';
import Board from './Board';

function IndividualBoard(props) {
  const {socket, board, pairing, showProgrammaticBoards} = props;

  if (!pairing) {
    return (
      <div className="NoPlayer"/>
    )
  }
  return (
    <Board
      board={board}
      pairing={pairing}
      large={true}
      showProgrammaticBoards={showProgrammaticBoards}
      socket={socket}
    />
  );
}

export default IndividualBoard;
