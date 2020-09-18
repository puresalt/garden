import React from 'react';
import {useLocation} from 'react-router-dom';
import Navbar from 'react-bootstrap/Navbar';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import NavbarBrand from 'react-bootstrap/NavbarBrand';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import LiveButton from './LiveButton';
import './Header.css';

function Header(props) {
  const {currentMatchId, stateLookup, currentOpponent, socket} = props;

  return <div className="Header">
    <div className="TopBar">
      <Container>
        <Row>
          <Col><a href="/">Matches</a></Col>
          <Col xs={2} className="text-right pr-0 pl-3"><a href="/quit">Sign Out</a></Col>
        </Row>
      </Container>
    </div>
    {
      currentMatchId
        ? <Navigation
          socket={socket}
          stateLookup={stateLookup}
          currentMatchId={currentMatchId}
          currentOpponent={currentOpponent}
        />
        : ''
    }
  </div>;
}

function Navigation(props) {
  const {socket, currentMatchId, currentOpponent, stateLookup} = props;

  const routerLinks = [
    ['/dashboard', 'Settings'],
    ['/results', 'Results'],
    ['/boards', 'Boards']
  ];

  const {pathname} = useLocation();

  return <Navbar>
    <Container>
      <Nav className="mr-auto">
        <NavbarBrand>#{currentMatchId} {stateLookup[currentOpponent] || <em>TBD</em>}</NavbarBrand>
        {routerLinks.map((tuple, i) => {
          if (pathname === tuple[0]) {
            return <Nav.Link key={i} href="javascript:void(0);" active={true}>{tuple[1]}</Nav.Link>;
          }
          return <Nav.Link key={i} href={tuple[0]}>{tuple[1]}</Nav.Link>;
        })}
      </Nav>
      <LiveButton socket={socket}/>
    </Container>
  </Navbar>;
}

export default Header;
