import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from 'react-bootstrap/Navbar';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import LiveButton from './LiveButton';
import './Header.css';

function Header(props) {
  const {socket, isLive, updateSetIsLive} = props;

  const {pathname} = useLocation();


  return <div className="Header">
    <div className="TopBar">
      <Container>
        <Row>
          <Col>
            <Nav>
              <Nav.Link
                href="#"
                onClick={(event) => event.preventDefault()}
                active={true}>Garden State Passers</Nav.Link>
            </Nav>
          </Col>
          <Col xs={2} className="text-right">
            <Nav>
              <Nav.Link href="/quit">Logout</Nav.Link>
            </Nav>
          </Col>
        </Row>
      </Container>
    </div>
    <Navigation
      socket={socket}
      isLive={isLive}
      pathname={pathname}
      updateSetIsLive={updateSetIsLive}
    />
  </div>;
}

function Navigation(props) {
  const {socket, pathname, isLive, updateSetIsLive} = props;

  return <Navbar>
    <Container>
      <Nav className="mr-auto">
        <Nav.Link href="/"
                  active={pathname !== '/configuration' && pathname !== '/k12' && pathname !== '/k9'}>Observer</Nav.Link>
        <Nav.Link href="/k12" active={pathname === '/k12'}>K-12 Pairings</Nav.Link>
        <Nav.Link href="/k9" active={pathname === '/k9'}>K-9 Pairings</Nav.Link>
        <Nav.Link href="/configuration" active={pathname === '/configuration'}>Configuration</Nav.Link>
      </Nav>
      <LiveButton socket={socket} isLive={isLive} updateSetIsLive={updateSetIsLive}/>
    </Container>
  </Navbar>;
}

export default Header;
