import React, { useState } from 'react';
import OrDefault from 'garden-common/react/OrDefault';
import Chessboard from 'garden-common/react/Chessboard';
import './Board.css';

function Board(props) {
  const {board, pairing, showProgrammaticBoards, observingGame, socket} = props;
  const {id, home, away} = pairing;

  const [result, setResult] = useState({});
  const handleResult = (board, data) => {
    setResult({
      by: data.by,
      result: data.result
    });
  };

  let boardSize = ' fadeIn';
  let size = 456;
  if (observingGame) {
    if (observingGame === id) {
      boardSize = ' fadeIn Large';
      size = 920;
    } else {
      boardSize = ' fadeOut';
    }
  }

  if (!showProgrammaticBoards) {
    boardSize += ' not-automatic';
  }

  const orientation = board % 2 === 1
    ? 'home'
    : 'away';

  let resultClassName = '';
  let resultContent = '';
  if (result.by) {
    resultClassName = result.by
      ? ` Faded winner-${result.result === 1 ? 'white' : (result.result === 0 ? 'black' : 'none')}`
      : '';

    let homeScore = 0.5;
    let awayScore = 0.5;
    let loser = '';
    if (result.result !== 0.5) {
      if ((orientation === 'home' && result.result === 1) || (orientation !== 'home' && result.result === 0)) {
        homeScore = 1;
        awayScore = 0;
        loser = away.name;
      } else {
        homeScore = 0;
        awayScore = 1;
        loser = home.name;
      }
    }

    resultContent = <div className="board-result">
      <div>
        <h2>{homeScore} - {awayScore}</h2>
        <h3>{loser} {result.by}</h3>
      </div>
    </div>;
  }

  return (
    <div className={`Board${boardSize} board-${board} orientation-${orientation}${resultClassName}`} key={board}>
      <header>
        <div className="board-header-away">
          <OrDefault value={away.name}/> <em><OrDefault value={away.rating}/></em>
        </div>
      </header>
      {showProgrammaticBoards
        ? <Chessboard
          boardName={'board:' + id}
          size={size}
          viewOnly={true}
          viewer={true}
          coordinates={false}
          orientation={orientation}
          onResult={handleResult}
          socket={socket}
        />
        : <div className="board-placeholder"/>
      }
      <footer>
        <div className="board-header-home">
          <OrDefault value={home.name}/> <em><OrDefault value={home.rating}/></em>
        </div>
      </footer>
      {resultContent}
    </div>
  );
}

export default Board;
