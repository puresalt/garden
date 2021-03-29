import React from 'react';
import Board from './Board';
import Score from './Score';

function Match(props) {
  const {socket, observingGame, matchData, showProgrammaticBoards, small} = props;

  return <>
    <Score
      homeTeamId={matchData.home.id}
      awayTeamId={matchData.away.id}
      observingGame={observingGame}
    />
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
