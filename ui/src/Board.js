import React, { useEffect, useState } from 'react';
import OrDefault from 'garden-common/react/OrDefault';
import Chessboard from 'garden-common/react/Chessboard';
import './Board.css';

function Board(props) {
  const {board, socket} = props;

  const [home, setHome] = useState({name: 'LOADING', rating: 'N/A'});
  const updateHome = (home) => {
    setHome(home);
  }
  const [away, setAway] = useState({name: 'LOADING', rating: 'N/A'});
  const updateAway = (away) => {
    setAway(away);
  }

  useEffect(() => {
    socket.on(`viewer:board:${board}:home`, updateHome);
    socket.on(`viewer:board:${board}:away`, updateAway);
    return () => {
      socket.on(`viewer:board:${board}:home`, updateHome);
      socket.on(`viewer:board:${board}:away`, updateAway);
    };
  });

  const [result, setResult] = useState({});
  const handleResult = (board, data) => {
    setResult({
      by: data.by,
      result: data.result
    });
  };

  const [isLoading, setIsLoading] = useState(true);
  const handleLoading = (board, loading) => {
    setIsLoading(loading);
  };

  let boardSize = ' fadeIn';
  let size = 456;
  const orientation = 'home';

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
      if (result.result === 1) {
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
  } else if (isLoading) {
    resultContent = <div className="board-result">
      <div>
        <h2>Loading</h2>
        <h3>Please wait a moment...</h3>
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
      <Chessboard
        boardName={`board:${board}`}
        size={size}
        viewOnly={true}
        viewer={true}
        coordinates={false}
        orientation={orientation}
        onResult={handleResult}
        onLoading={handleLoading}
        socket={socket}
      />
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
