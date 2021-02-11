import React from 'react';
import Board from './Board';

function IndividualBoard(props) {
  const {board, pairing} = props;

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
    />
  );
}

export default IndividualBoard;
