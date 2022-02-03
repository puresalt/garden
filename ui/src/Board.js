import React, { useEffect, useState } from 'react';
import OrDefault from 'garden-common/react/OrDefault';
import Chessboard from 'garden-common/react/Chessboard';
import './Board.css';

function Board(props) {
  const {boardId, appendClassName, size, socket} = props;
  const gameHash = `rapid:viewer:board:${boardId}`;

  const [home, setHome] = useState({name: 'Unknown', rating: 'N/A'});
  const updateHome = (home) => {
    setHome(home);
  }
  const [away, setAway] = useState({name: 'Unknown', rating: 'N/A'});
  const updateAway = (away) => {
    setAway(away);
  }

  useEffect(() => {
    socket.on(`${gameHash}:home`, updateHome);
    socket.on(`${gameHash}:away`, updateAway);
    socket.emit(`${gameHash}:start`);
    return () => {
      socket.off(`${gameHash}:home`, updateHome);
      socket.off(`${gameHash}:away`, updateAway);
    };
  }, []);

  const [result, setResult] = useState(null);
  const handleResult = (board, data) => {
    setResult(data.result);
  };

  const [isLoading, setIsLoading] = useState(true);
  const handleLoading = (board, loading) => {
    setIsLoading(loading);
  };

  let boardSize = ' fadeIn';
  const orientation = 'home';

  let resultClassName = '';
  let resultContent = '';
  let awayWinner = '';
  let homeWinner = '';

  if (typeof result === 'number') {
    resultClassName = result !== 0.5
      ? ` Faded winner-${result === 1 ? 'white' : (result === 0 ? 'black' : 'none')}`
      : ' Faded';

    let homeScore = 0.5;
    let awayScore = 0.5;
    let winner = '';
    if (result !== 0.5) {
      if (result === 1) {
        homeScore = 1;
        awayScore = 0;
        homeWinner = ' winner';
        winner = home.name;
      } else {
        homeScore = 0;
        awayScore = 1;
        awayWinner = ' winner';
        winner = away.name;
      }
    }

    resultContent = <div className="board-result">
      <div>
        <h2>{homeScore} - {awayScore}</h2>
        <h3>{winner ? `${winner} wins` : 'Game Drawn'}</h3>
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

  let awayName = 'Unknown';
  if (away && away.name) {
    awayName = away.name;
  }

  let homeName = 'Unknown';
  if (home && home.name) {
    homeName = home.name;
  }

  return (
    <div
      className={`Board${boardSize} board-${boardId} orientation-${orientation}${resultClassName} size-${appendClassName}`}
      key={boardId}>
      <header>
        <div className={`board-header-away${awayWinner}`}>
          <OrDefault value={awayName}/>
        </div>
      </header>
      <Chessboard
        boardId={boardId}
        size={size}
        viewOnly={true}
        viewer={true}
        coordinates={false}
        orientation={orientation}
        onResult={handleResult}
        onLoading={handleLoading}
        socket={socket}
      />
      <footer>
        <div className={`board-header-home${homeWinner}`}>
          <OrDefault value={homeName}/>
        </div>
      </footer>
      {resultContent}
    </div>
  );
}

export default Board;
