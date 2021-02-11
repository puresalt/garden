import React from 'react';
import OrDefault from 'garden-common/react/OrDefault';
import './Board.css';

function Board(props) {
  const {board, pairing, large} = props;

  const done = pairing.result !== null;

  return (
    <div className={'Board' + (large ? ' Large' : (done ? ' Faded' : ''))} key={board}
         id={'board-' + board}>
      <header>
        <div className="board-header-home"><OrDefault value={pairing.home.name}/> <em><OrDefault value={pairing.home.rating}/></em></div>
        <div className="board-header-away"><OrDefault value={pairing.away.name}/> <em><OrDefault value={pairing.away.rating}/></em></div>
      </header>
      <>
        <div className="board-placeholder"/>
        <div className="board-placeholder-info"/>
      </>
      {done ? <div className="board-result">{pairing.result} - {1 - pairing.result}</div> : <></>}
    </div>
  );
}

export default Board;
