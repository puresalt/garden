import React from 'react';
import Board from './Board';
import {useParams} from 'react-router-dom';

function IndividualBoard(props) {
  const {socket, boardNumber, pairing, showProgrammaticBoards, debugMode} = props;

  if (!pairing) {
    return (
      <div className="NoPlayer"/>
    )
  }
  return (
    <Board
      board={boardNumber}
      debugMode={debugMode}
      showProgrammaticBoards={showProgrammaticBoards}
      name={pairing.name}
      rating={pairing.rating}
      pairings={pairing.pairings}
      socket={socket}
      boardDimensions={{left: 7, top: 7}}
      boardInfoDimensions={{left: 0, top: 121, height: 600, width: 446}}
      large={true}
    />
  );
}

export default IndividualBoard;
