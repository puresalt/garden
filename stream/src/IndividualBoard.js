import React from 'react';
import Board from './Board';
import {useParams} from 'react-router-dom';

function IndividualBoard(props) {
  const {boardNumber} = useParams();
  const item = props.results[boardNumber - 1];
  if (!item) {
    return (
      <div className="NoPlayer">TBD</div>
    )
  }
  return (
    <Board
      board={boardNumber}
      player={item.player}
      rating={item.rating}
      pairings={item.pairings}
      socketEvent={props.socketEvent}
      large={true}
    />
  );
}

export default IndividualBoard;
