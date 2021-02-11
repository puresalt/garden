import React from 'react';
import Board from './Board';
import IndividualBoard from './IndividualBoard';

function Match(props) {
  const {pairings, currentBoardNumber} = props;

  return (
    <>
      {currentBoardNumber
        ? <IndividualBoard
          currentPairingId={currentBoardNumber}
          board={currentBoardNumber}
          pairing={pairings[currentBoardNumber - 1]}
        />
        : pairings.map((item, i) => {
          return <Board
            key={i + 1}
            board={i + 1}
            pairing={item}
          />;
        })}
    </>
  );
}

export default Match;
