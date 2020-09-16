import React from 'react';
import Jumbotron from 'react-bootstrap/Jumbotron';

function Dashboard() {
  return <div className="Dashboard">
    <Jumbotron>
      <h1>Match ()</h1>
      <p>Here you can update</p>
    </Jumbotron>
    <input readOnly={true} value="https://stream.garden.ps.vg"/>
    <input readOnly={true} value="https://stream.garden.ps.vg/board/1"/>
    <input readOnly={true} value="https://stream.garden.ps.vg/board/2"/>
    <input readOnly={true} value="https://stream.garden.ps.vg/board/3"/>
    <input readOnly={true} value="https://stream.garden.ps.vg/board/4"/>
    <input readOnly={true} value="https://observer.garden.ps.vg"/>
  </div>;
}

export default Dashboard;
