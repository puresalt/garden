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

const CONFIG = Config(process.env);
const socket = socketIoClient(CONFIG.socketIo.url, {
  path: '/viewer'
});

function App() {
  return <div className="App">
    <Container fluid className="boards">
      <Row>
        <Col sm={6}>
          <a href="https://chessclub.com"><img src={logo}/></a>
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
    <Container className="footer">
      <Row>
        <Col>Powered by <a href="https://passers.gg">Garden State Passers</a></Col>
      </Row>
    </Container>
  </div>;
}

export default App;
