import React from 'react';
import Board from './Board';
import IndividualBoard from './IndividualBoard';

function Match(props) {
  const {socket, pairings, currentBoardNumber, showProgrammaticBoards} = props;

  return (
    <>
      {currentBoardNumber
        ? <IndividualBoard
          currentPairingId={currentBoardNumber}
          board={currentBoardNumber}
          showProgrammaticBoards={showProgrammaticBoards}
          pairing={pairings[currentBoardNumber - 1]}
          socket={socket}
        />
        : pairings.map((item, i) => {
          return <Board
            key={i + 1}
            showProgrammaticBoards={showProgrammaticBoards}
            board={i + 1}
            pairing={item}
            socket={socket}
          />;
        })}
    </>
  );
}

export default Match;
