import React, {useEffect, useState} from 'react';
import Row from 'react-bootstrap/Row';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Button from 'react-bootstrap/Button';
import OrDefault from 'gscc-common/react/OrDefault';
import Chessboard from 'gscc-common/react/Chessboard';
import InputGroup from 'react-bootstrap/InputGroup';
import GameIdForm from './Pairings/GameIdForm';

function Board(props) {
  const {currentMatchId, board, player, pairings, socket} = props;

  const [currentRound, setCurrentRound] = useState(null);
  const [currentPairing, setCurrentPairing] = useState({});
  const updateCurrentRound = (round) => {
    const pairing = pairings[round];
    setCurrentRound(round);
    setCurrentPairing(pairing);
  };
  useEffect(() => {
    updateCurrentRound(pairings.filter(item => item.result !== null).length);
  }, [pairings]);

  const done = currentRound > pairings.length;
  const size = 320;
  const handleChangeBoard = (gameId) => {
    setCurrentPairing({
      ...currentPairing,
      gameId: gameId
    });
    socket.emit(`board:${board}:start`, gameId);
  };
  const handleDraw = (drawData) => {
    socket.emit(`board:${board}:draw`, {matchId: currentMatchId, draw: drawData});
  };
  const updateGameId = (_, gameId) => {
    socket.emit(`board:${board}:update`, {
      matchId: currentMatchId,
      player: player,
      opponent: {id: currentPairing.opponentId},
      gameId: gameId
    });
    setCurrentPairing({...currentPairing, gameId: gameId});
  };

  return (
    <div className={"Board" + (done ? ' Faded' : '')} key={board} id={'board-' + board}>
      <header>
        <span>BOARD {board}:</span> <OrDefault value={player.name}/>
        <InputGroup>
          <InputGroup.Prepend>Round</InputGroup.Prepend>
          <ButtonGroup>
            {[1, 2, 3, 4].map((i, index) => <Button
              key={index}
              size="sm"
              disabled={pairings[index].gameId === null}
              variant={(currentPairing.gameId && currentPairing.gameId === pairings[index].gameId) || index === currentRound ? 'primary' : 'secondary'}
              onChange={e => handleChangeBoard(pairings[index].gameId)}
            >{i}</Button>)
            }
          </ButtonGroup>
        </InputGroup>
      </header>
      <Chessboard
        boardName={'board:' + board}
        size={size}
        gameId={currentPairing.gameId}
        movable={{enabled: false}}
        draggable={{enabled: false}}
        selectable={{enabled: false}}
        viewOnly={false}
        coordinates={false}
        drawable={{onChange: handleDraw}}
        socket={socket}
      />
      <div className="container">
        <Row>
          <div className="col-5 game-form">
            <GameIdForm
              pairingIndex={currentRound}
              currentGameId={currentPairing.gameId}
              updateGameId={updateGameId}
              isNotReady={!player.id || !currentPairing.opponentId}
              size="sm"
            />
          </div>
        </Row>
      </div>
    </div>
  );
}

export default Board;
