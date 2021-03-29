import React from 'react';
import './Header.css';
import Button from 'react-bootstrap/Button';
import { Container } from 'react-bootstrap';

function Header() {
  return <div className="Header">
    <Container fluid className="text-right">
      <Button href="/quit">Logout</Button>
    </Container>
  </div>;
}

export default Header;
