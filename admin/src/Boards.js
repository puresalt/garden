import React from 'react';
import Board from './Board';

function Boards(props) {
  const {socket} = props;

  return <div className="Boards">
    {[].map((item, i) => {
      return <Board
        key={i + 1}
        board={i + 1}
        player={item.player}
        rating={item.rating}
        pairings={item.pairings}
        socket={socket}
      />;
    })}
  </div>;
}

export default Boards;
