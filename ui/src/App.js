import socketIoClient from 'socket.io-client';
import { Config } from 'garden-common';
import React from 'react';
import { BrowserRouter as Router, Route, Switch, useParams } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Board from './Board';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import logo from './logo.png';
import eventLogo from './eventLogo.svg';

const BOARDS = [1, 2, 3, 4];
Object.freeze(BOARDS);
const CONFIG = Config(process.env.NODE_ENV);
const socket = socketIoClient(CONFIG.socketIo.url, {
  path: '/viewer'
});

function Layout(props) {
  const {isLogoVisible, isFixedDimensions, isStreamLayout} = props;

  const {requestedBoardId} = useParams();
  const boardId = requestedBoardId
    ? parseInt(requestedBoardId)
    : 0;

  const size = 456;
  let appendClassName = '';

  if (boardId) {
    appendClassName = 'individual';
  } else if (isStreamLayout) {
    appendClassName = 'stream';
    document.body.classList.add('stream');
    document.documentElement.classList.add('stream');
  }

  if (isFixedDimensions) {
    document.body.classList.add('fixed');
    document.documentElement.classList.add('fixed');
  }

  return <div className={`App${isFixedDimensions ? ' fixed' : ''}`}>
    {
      isLogoVisible
        ? <Container fluid className="logos">
          <Row>
            <Col className="logo align-middle">
              <a href="https://www.chessclub.com"><img src={logo}/></a>
            </Col>
            <Col className="event-logo align-middle">
              <img src={eventLogo} />
            </Col>
          </Row>
        </Container>
        : <></>
    }
    <Container fluid className="boards">
      <Row className="justify-content-center">
        {
          boardId >= 1 && boardId <= 4
            ? <Col sm={12}>
              <Board
                appendClassName={appendClassName}
                size={size}
                boardId={boardId}
                socket={socket}
              />
            </Col>
            : BOARDS.map((boardId) => {
              return <Col sm={12} md={6} lg={6} xl={6} key={`board-${boardId}`}>
                <Board
                  appendClassName={appendClassName}
                  size={size}
                  boardId={boardId}
                  socket={socket}
                />
              </Col>
            })
        }
      </Row>
    </Container>
  </div>;
}

function App() {
  return (
    <Router>
      <Switch>
        <Route path="/board/:requestedBoardId">
          <Layout
            isFixedDimensions={true}
            isLogoVisible={false}
            isStreamLayout={false}
            socket={socket}
          />
        </Route>
        <Route path="/iframe">
          <Layout
            isLogoVisible={false}
            isFixedDimensions={false}
            isStreamLayout={false}
            socket={socket}
          />
        </Route>
        <Route path="/stream">
          <div className="fixed-holder">
            <div className="logos">
              <div>
                <img src={eventLogo}/>
              </div>
              <div>
                <img src={logo}/>
              </div>
            </div>
            <Layout
              isLogoVisible={false}
              isFixedDimensions={true}
              isStreamLayout={true}
              socket={socket}
            />
          </div>
        </Route>
        <Route path="/">
          <Layout
            isLogoVisible={true}
            isFixedDimensions={false}
            isStreamLayout={false}
            socket={socket}
          />
        </Route>
      </Switch>
    </Router>
  )
}

export default App;
