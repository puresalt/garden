import React, { useEffect, useState } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Players from './Players';
import LoadingOverlay from 'react-loading-overlay';
import LoadingOverlayText from './LoadingOverlayText';

const emptyTeam = () => {
  return {
    name: null,
    players: [
      {id: null, handle: null, rating: null},
      {id: null, handle: null, rating: null},
      {id: null, handle: null, rating: null},
      {id: null, handle: null, rating: null}
    ]
  };
};

function Dashboard(props) {
  const {socket} = props;

  const [isLoading, setIsLoading] = useState(true);
  const [matchOneHome, setMatchOneHome] = useState(emptyTeam());
  const [matchOneAway, setMatchOneAway] = useState(emptyTeam());
  const [matchTwoHome, setMatchTwoHome] = useState(emptyTeam());
  const [matchTwoAway, setMatchTwoAway] = useState(emptyTeam());

  const updateList = (data) => {
    setIsLoading(false);
    setMatchOneHome(data[0].home);
    setMatchOneAway(data[0].away);
    setMatchTwoHome(data[1].home);
    setMatchTwoAway(data[1].away);
  };
  const handleOnSubmit = (group, teamName, players) => {
    socket.emit('match:update', group, teamName, players);
  };
  useEffect(() => {
    setIsLoading(true);
    socket.emit('match:list');
    socket.on('match:listed', updateList);
    return () => {
      socket.off('match:listed', updateList);
    }
  }, []);

  return <div className="Dashboard">
    <LoadingOverlay active={isLoading} spinner={false} text={<LoadingOverlayText/>}>
      <h2>Match 1</h2>
      <Row>
        <Col>
          <Players
            teamName={matchOneHome.name}
            players={matchOneHome.players}
            onSubmit={(name, players) => handleOnSubmit('matchOneHome', name, players)}
          />
        </Col>
        <Col>
          <Players
            teamName={matchOneAway.name}
            players={matchOneAway.players}
            onSubmit={(name, players) => handleOnSubmit('matchOneAway', name, players)}
          />
        </Col>
      </Row>
      <hr/>
      <h2>Match 2</h2>
      <Row>
        <Col>
          <Players
            teamName={matchTwoHome.name}
            players={matchTwoHome.players}
            onSubmit={(name, players) => handleOnSubmit('matchTwoHome', name, players)}
          />
        </Col>
        <Col>
          <Players
            teamName={matchTwoAway.name}
            players={matchTwoAway.players}
            onSubmit={(name, players) => handleOnSubmit('matchTwoAway', name, players)}
          />
        </Col>
      </Row>
    </LoadingOverlay>
  </div>;
}

export default Dashboard;
