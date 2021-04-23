import React, { useEffect, useState } from 'react';
import LoadingOverlay from 'react-loading-overlay';
import LoadingOverlayText from './LoadingOverlayText';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import './Sections.css';
import Board from './Board';
import ExamineBoard from './ExamineBoard';
import './Board.css';
import Button from 'react-bootstrap/Button';

function Observer(props) {
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
                  section={pairing.section}
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
            </div>
          </Col>
          <Col lg={4}>
            <ExamineBoard
              examiningGame={examiningGame}
              orientation="home"
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
    section,
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
    <h2><strong>{section || <em>Unnamed Section</em>}</strong></h2>
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
        orientation="home"
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
    <div className="player-name away">{String(away.name).substring(0, 64)}{' '}
      <em><small>({away.rating || 'Unrated'})</small></em></div>
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
    <div className="player-name home">{String(home.name).substring(0, 64)}{' '}
      <em><small>({home.rating || 'Unrated'})</small></em>
    </div>
  </Col>;
}

export default Observer;
