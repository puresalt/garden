import React from 'react';
import Board from './Board';
import IndividualBoard from './IndividualBoard';

const boardDimensions = [
  {left: 7, top: 50},
  {left: 700, top: 7},
  {left: 7, top: 566},
  {left: 700, top: 566}
];
const boardInfoDimensions = [
  {left: 477, top: 214, height: 600, width: 223},
  {left: 1166, top: 730, height: 600, width: 223},
  {left: 477, top: 214, height: 600, width: 223},
  {left: 1166, top: 7340, height: 600, width: 223}
];

function Match(props) {
  const {pairings, currentBoardNumber, showProgrammaticBoards, showDebugInformation, socket} = props;

  return (
    <>
      {currentBoardNumber
        ? <IndividualBoard
          currentPairingId={currentBoardNumber}
          board={currentBoardNumber}
          showProgrammaticBoards={showProgrammaticBoards}
          debugMode={showDebugInformation}
          pairing={pairings[currentBoardNumber - 1]}
          socket={socket}
        />
        : pairings.map((item, i) => {
          return <Board
            key={i + 1}
            showProgrammaticBoards={showProgrammaticBoards}
            board={i + 1}
            debugMode={showDebugInformation}
            name={item.name}
            rating={item.rating}
            pairings={item.pairings}
            boardDimensions={boardDimensions[i]}
            boardInfoDimensions={boardInfoDimensions[i]}
            socket={socket}
          />;
        })}
    </>
  );
}

export default Match;
