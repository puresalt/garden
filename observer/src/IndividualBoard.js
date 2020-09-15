import React from 'react';
import Board from './Board';
import {useParams} from 'react-router-dom';

function IndividualBoard(props) {
  const {boardNumber} = useParams();
  console.log('RESULTS:', props.results, boardNumber);
  const item = props.results[boardNumber - 1];
  if (item) {
    return (
      <Board
        board={boardNumber}
        player={item.player}
        rating={item.rating}
        pairings={item.pairings}
        large={true}
      />
    );
  }
  return (
    <div className="NoPlayer">TBD</div>
  );
}

export default IndividualBoard;
