import socketIoClient from 'socket.io-client';
import { Config } from 'garden-common';
import React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Board from './Board';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import logo from './logo.png';
import eventLogo from './eventLogo.jpg';

const CONFIG = Config(process.env.NODE_ENV);
const socket = socketIoClient(CONFIG.socketIo.url, {
  path: '/viewer'
});

function App() {
  return <div className="App">
    <Container fluid className="boards">
      <Row>
        <Col className="logo align-middle">
          <a href="https://chessclub.com"><img src={logo}/></a>
        </Col>
        <Col className="event-logo align-middle">
          <img src={eventLogo}/>
        </Col>
      </Row>
    </Container>
    <Container fluid className="boards">
      <Row>
        <Col sm={12} md={6} lg={4} xl={3}>
          <Board
            boardId={1}
            socket={socket}
          />
        </Col>
        <Col sm={12} md={6} lg={4} xl={3}>
          <Board
            boardId={2}
            socket={socket}
          />
        </Col>
        <Col sm={12} md={6} lg={4} xl={3}>
          <Board
            boardId={3}
            socket={socket}
          />
        </Col>
        <Col sm={12} md={6} lg={4} xl={3}>
          <Board
            boardId={4}
            socket={socket}
          />
        </Col>
        <Col sm={12} md={6} lg={4} xl={3}>
          <Board
            boardId={5}
            socket={socket}
          />
        </Col>
        <Col sm={12} md={6} lg={4} xl={3}>
          <Board
            boardId={6}
            socket={socket}
          />
        </Col>
        <Col sm={12} md={6} lg={4} xl={3}>
          <Board
            boardId={7}
            socket={socket}
          />
        </Col>
        <Col sm={12} md={6} lg={4} xl={3}>
          <Board
            boardId={8}
            socket={socket}
          />
        </Col>
      </Row>
    </Container>
  </div>;
}

export default App;
