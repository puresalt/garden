import React from 'react';
import Board from './Board';

function Match(props) {
  const {socket, observingGame, matchData, showProgrammaticBoards, small} = props;

  return <>
    {matchData.matchUps.map((item, i) => {
      return <Board
        key={i + 1}
        board={i + 1}
        pairing={item}
        observingGame={observingGame}
        showProgrammaticBoards={showProgrammaticBoards}
        socket={socket}
        small={small}
      />;
    })}
  </>;
}

export default Match;
