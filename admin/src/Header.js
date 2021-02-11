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

  const routerLinks = [
    ['/configuration', 'Configuration']
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
    <Navigation
      socket={socket}
      isLive={isLive}
      pathname={pathname}
      updateSetIsLive={updateSetIsLive}
    />
    }
  </div>;
}

function Navigation(props) {
  const {socket, pathname, isLive, updateSetIsLive} = props;

  const routerLinks = [
    ['/pairings', 'Pairings'],
    ['/boards', 'Boards']
  ];

  return <Navbar>
    <Container>
      <Nav className="mr-auto">
        {routerLinks.map((tuple, i) => {
          if (pathname === tuple[0]) {
            return <Nav.Link key={i} href={tuple[0]} onClick={(event) => event.preventDefault()}
                             active={true}>{tuple[1]}</Nav.Link>;
          }
          return <Nav.Link key={i} href={tuple[0]}>{tuple[1]}</Nav.Link>;
        })}
      </Nav>
      <LiveButton socket={socket} isLive={isLive} updateSetIsLive={updateSetIsLive}/>
    </Container>
  </Navbar>;
}

export default Header;
