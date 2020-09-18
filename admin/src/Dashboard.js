import React, {useState} from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Players from './Players';
import Settings from './Settings';

function Dashboard(props) {
  const {socket, stateLookup, currentMatchId, currentOpponent} = props;

  const handleSubmit = (data) => {
    socket.emit('match:update', data);
  };

  return <div className="Dashboard">
    <Row>
      <Col xs={4}>
        <Settings
          currentMatchId={currentMatchId}
          currentOpponent={currentOpponent}
          onSubmit={handleSubmit}
          socket={socket}
          stateLookup={stateLookup}
        />
      </Col>
      <Col>
        <Players
          currentMatchId={currentMatchId}
          currentOpponent={currentOpponent}
          socket={socket}
          stateLookup={stateLookup}
        />
      </Col>
    </Row>
  </div>;
}

export default Dashboard;
