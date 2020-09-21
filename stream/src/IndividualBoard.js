import React from 'react';
import Board from './Board';
import {useParams} from 'react-router-dom';

function IndividualBoard(props) {
  const {socket, players} = props;

  const {boardNumber} = useParams();

  const player = players[boardNumber - 1];

  if (!player) {
    return (
      <div className="NoPlayer">TBD</div>
    )
  }
  return (
    <Board
      board={boardNumber}
      name={player.name}
      rating={player.rating}
      pairings={player.pairings}
      socket={socket}
      large={true}
    />
  );
}

export default IndividualBoard;
