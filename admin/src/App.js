import React, {useEffect, useState} from 'react';
import {BrowserRouter as Router, Route, Switch, useLocation} from 'react-router-dom';
import EventEmitter from 'events';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import OrDefault from 'gscc-common/react/OrDefault';
import Dashboard from './Dashboard';
import Boards from './Boards';
import Results from './Results';
import Players from './Players';
import Settings from './Settings';
import LiveButton from './LiveButton';
import {Data} from 'gscc-common';
import './App.css';

const STATE_LIST = Data.StateLookup;
const socketEvent = new EventEmitter();

const routerLinks = [
  ['/', 'Dashboard'],
  ['/boards', 'Boards'],
  ['/results', 'Results'],
  ['/players', 'Players'],
  ['/settings', 'Settings']
];

function Header(props) {
  const {pathname} = useLocation();

  return <Nav className="mr-auto">
    {routerLinks.map((tuple, i) => {
      if (pathname === tuple[0]) {
        return <Nav.Link key={i} href="javascript:void(0);" active={true}>{tuple[1]}</Nav.Link>;
      }
      return <Nav.Link key={i} href={tuple[0]}>{tuple[1]}</Nav.Link>;
    })}
  </Nav>;
}

function App() {
  return (
    <Router>
      <div className="TopBar">
        <Container>
          <Row>
            <Col><Match socketEvent={socketEvent}/></Col>
            <Col xs={2} className="pull-right pr-0 pl-3"><a href="/quit">Sign Out</a></Col>
          </Row>
        </Container>
      </div>
      <Navbar>
        <Container>
          <Header matchId={false} matchName={false} socketEvent={socketEvent}/>
          <LiveButton socketEvent={socketEvent} isLive={true}/>
        </Container>
      </Navbar>
      <Container className="p-3">
        <Switch>
          <Route path="/boards" children={<Boards socketEvent={socketEvent}/>}/>
          <Route path="/results" children={<Results socketEvent={socketEvent}/>}/>
          <Route path="/players" exact children={<Players socketEvent={socketEvent}/>}/>
          <Route path="/settings" children={<Settings stateList={STATE_LIST} socketEvent={socketEvent}/>}/>
          <Route path="/" children={<Dashboard/>}/>
        </Switch>
      </Container>
    </Router>
  )
}

function Match(props) {
  const [matchId, setMatchId] = useState(props.matchId);
  const [matchName, setMatchName] = useState(props.matchName);

  const updateMatch = (data) => {
    setMatchName(data.name);
    setMatchId(data.id);
  };

  useEffect(() => {
    socketEvent.on('match', updateMatch);
    return () => {
      socketEvent.off('match', updateMatch);
    };
  }, []);

  let fullMatchName = matchName || '';
  if (matchId) {
    fullMatchName = `#${matchId} ${matchName}`;
  }

  return <div className="Match">Match: <strong><OrDefault value={fullMatchName}/></strong></div>;
}

export default App;
