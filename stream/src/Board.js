import React, { useEffect } from 'react';
import OrDefault from 'garden-common/react/OrDefault';
import Chessboard from 'garden-common/react/Chessboard';
import './Board.css';

function Board(props) {
  const {board, pairing, showProgrammaticBoards, large, socket} = props;
  const {home, away, result} = pairing;

  const size = large
    ? 970
    : 480;

  let homeColor = 'white';
  let awayColor = 'black';
  if ((board % 2) === 0) {
    homeColor = 'black';
    awayColor = 'white';
  }

  return (
    <div className={'Board' + (large ? ' Large' : '')} key={board}
         id={'board-' + board}>
      <header>
        <span>Board <OrDefault value={board} />:</span>
        <div className="board-header-home">
          <div class={`${homeColor}-square`}/>
          <OrDefault value={home.name}/> <em><OrDefault value={home.rating}/></em>
        </div>
        <div className="board-header-away">
          <div className={`${awayColor}-square`}/>
          <OrDefault value={away.name}/> <em><OrDefault value={away.rating}/></em>
        </div>
      </header>
      {showProgrammaticBoards
        ? <Chessboard
          boardName={'board:' + board}
          size={size}
          viewOnly={true}
          viewer={true}
          coordinates={false}
          orientation={board % 2 === 1 ? 'home' : 'away'}
          socket={socket}
        />
        : <>
          <div className="board-placeholder"/>
          <div className="board-placeholder-info"/>
        </>
      }
      {typeof result === 'number' ? <div className="board-result">{result} - {1 - result}</div> : <></>}
    </div>
  );
}

export default Board;
