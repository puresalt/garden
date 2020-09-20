import React from 'react';
import {useLocation} from 'react-router-dom';
import Navbar from 'react-bootstrap/Navbar';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import NavbarBrand from 'react-bootstrap/NavbarBrand';
import LiveButton from './LiveButton';
import './Header.css';

function Header(props) {
  const {currentMatchId, stateLookup, currentOpponent, socket} = props;

  const {pathname} = useLocation();

  const routerLinks = [
    ['/', 'Matches'],
    ['/members', 'Members']
  ];

  return <div className="Header">
    <div className="TopBar">
      <Container>
        <Row>
          <Col>
            <Nav>
              {routerLinks.map((tuple, i) => {
                if (pathname === tuple[0]) {
                  return <Nav.Link key={i} href={tuple[0]} onClick={(event) => event.preventDefault()}
                                   active={true}>{tuple[1]}</Nav.Link>;
                }
                return <Nav.Link key={i} href={tuple[0]}>{tuple[1]}</Nav.Link>;
              })}
            </Nav>
          </Col>
          <Col xs={2} className="text-right">
            <Nav>
              <Nav.Link href="/quit">Sign Out</Nav.Link>
            </Nav>
          </Col>
        </Row>
      </Container>
    </div>
    {
      currentMatchId
        ? <Navigation
          socket={socket}
          pathname={pathname}
          stateLookup={stateLookup}
          currentMatchId={currentMatchId}
          currentOpponent={currentOpponent}
        />
        : ''
    }
  </div>;
}

function Navigation(props) {
  const {socket, pathname, currentMatchId, currentOpponent, stateLookup} = props;

  const routerLinks = [
    ['/dashboard', 'Settings'],
    ['/pairings', 'Pairings'],
    ['/boards', 'Boards']
  ];

  return <Navbar>
    <Container>
      <Nav className="mr-auto">
        <NavbarBrand>#{currentMatchId} {stateLookup[currentOpponent] || <em>TBD</em>}</NavbarBrand>
        {routerLinks.map((tuple, i) => {
          if (pathname === tuple[0]) {
            return <Nav.Link key={i} href={tuple[0]} onClick={(event) => event.preventDefault()}
                             active={true}>{tuple[1]}</Nav.Link>;
          }
          return <Nav.Link key={i} href={tuple[0]}>{tuple[1]}</Nav.Link>;
        })}
      </Nav>
      <LiveButton socket={socket}/>
    </Container>
  </Navbar>;
}

export default Header;
