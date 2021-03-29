import React, { useEffect, useState } from 'react';
import LoadingOverlay from 'react-loading-overlay';
import LoadingOverlayText from './LoadingOverlayText';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import './Matches.css';
import Board from './Board';
import ExamineBoard from './ExamineBoard';
import './Board.css';
import Button from 'react-bootstrap/Button';
import { Table } from 'react-bootstrap';

function isOdd(num) {
  return num % 2 === 1;
}

function Matches(props) {
  const {
    socket,
    observingMatch,
    handleObserveMatch,
    observingGame,
    handleObserveGame,
    examiningGame,
    handleExamineGame
  } = props;

  const [isLoading, setIsLoading] = useState(true);
  const [pairingList, setPairingList] = useState([]);
  const updateList = (incomingPairingList) => {
    setIsLoading(false);
    setPairingList(incomingPairingList);
  };

  useEffect(() => {
    setIsLoading(true);
    socket.emit('match:list');
    socket.on('match:listed', updateList);
    return () => {
      socket.off('match:listed', updateList);
    }
  }, []);

  const observingPairingList = pairingList[observingMatch - 1];

  return <LoadingOverlay active={isLoading} spinner={false} text={<LoadingOverlayText/>}>
    <div className="Pairings">
      <Container fluid className={'p-3'}>
        <Row>
          <Col lg={3}/>
          <Col lg={5}>
            <div className={'match-holder-container float-right'}>
              {pairingList.map((pairing) => {
                return <Pairing
                  key={pairing.id}
                  home={pairing.home.name}
                  away={pairing.away.name}
                  matchUps={pairing.matchUps}
                  observingMatch={observingMatch === pairing.id}
                  handleObserveMatch={() => handleObserveMatch(pairing.id)}
                  observingGame={observingGame}
                  handleObserveGame={handleObserveGame}
                  examiningGame={examiningGame}
                  handleExamineGame={handleExamineGame}
                  socket={socket}
                />;
              })}
              <PlayerList pairingList={observingPairingList} observingGame={observingGame}/>
            </div>
          </Col>
          <Col lg={4}>
            <ExamineBoard
              examiningGame={examiningGame}
              orientation={isOdd(examiningGame || 1) ? 'home' : 'away'}
              socket={socket}
            />
          </Col>
        </Row>
      </Container>
    </div>
  </LoadingOverlay>;
}

function Pairing(props) {
  const {
    home,
    away,
    matchUps,
    observingMatch,
    handleObserveMatch,
    observingGame,
    handleObserveGame,
    examiningGame,
    handleExamineGame,
    socket
  } = props;

  return <div className={`match-holder float-right${observingMatch ? ' watching' : ''}`}>
    <Button
      className={'observe-button'}
      variant={observingMatch ? 'success' : 'primary'}
      onClick={handleObserveMatch}
    >
      <i className={'fa fa-eye'}/>
    </Button>
    <h2><strong>{home || <em>Unnamed Team</em>}</strong> vs <strong>{away || <em>Unnamed Team</em>}</strong>
    </h2>
    <Row>
      {matchUps.map((matchUp, i) => <MatchUp
        key={i}
        boardId={matchUp.id}
        board={matchUp.board}
        observingGame={observingGame}
        examiningGame={examiningGame}
        handleObserveGame={handleObserveGame}
        handleExamineGame={handleExamineGame}
        home={matchUp.home}
        away={matchUp.away}
        orientation={isOdd(i) ? 'away' : 'home'}
        socket={socket}
      />)}
    </Row>
  </div>;
}

function MatchUp(props) {
  const {
    board,
    orientation,
    boardId,
    observingGame,
    handleObserveGame,
    examiningGame,
    handleExamineGame,
    home,
    away,
    socket
  } = props;

  return <Col lg={3}>
    <div className="player-name away">{away.name}</div>
    <Board
      pairing={board}
      boardId={boardId}
      board={'examine'}
      observingGame={boardId === observingGame}
      examiningGame={boardId === examiningGame}
      handleObserveGame={handleObserveGame}
      handleExamineGame={handleExamineGame}
      orientation={orientation}
      socket={socket}
    />
    <div className="player-name home">{home.name}</div>
  </Col>;
}

function PlayerList(props) {
  const {pairingList, observingGame} = props;

  if (!pairingList) {
    return <></>;
  }

  return <Table>
    <thead>
    <tr>
      <th/>
      <th scope="col">{pairingList.home.name}</th>
      <th scope="col">{pairingList.away.name}</th>
    </tr>
    </thead>
    <tbody>
    {pairingList.matchUps.map((matchUp, index) => {
      let homeClassName = 'alert-dark';
      let awayClassName = '';
      if (isOdd(matchUp.id)) {
        homeClassName = '';
        awayClassName = 'alert-dark';
      }

      return <tr key={index} className={observingGame === matchUp.id ? 'bold' : ''}>
        <th scope="row">{matchUp.board}</th>
        <td className={homeClassName}>{matchUp.home.name}</td>
        <td className={awayClassName}>{matchUp.away.name}</td>
      </tr>;
    })}
    </tbody>
  </Table>;
}

export default Matches;
