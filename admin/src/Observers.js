import React, { useEffect, useState } from 'react';
import Table from 'react-bootstrap/Table';
import ObserverSeekForm from './ObserverSeekForm';
import Container from 'react-bootstrap/Container';

function Observers(props) {
  const {socket} = props;

  const [observerList, setObserverList] = useState([]);
  const updateList = (incomingObserverList) => {
    setObserverList(incomingObserverList);
  };

  const updateSeek = (id, seek) => {
    socket.emit('observer:update', id, seek);
  }

  useEffect(() => {
    socket.emit('observer:list');
    socket.on('observer:listed', updateList);
    return () => {
      socket.off('observer:listed', updateList);
    }
  }, []);

  return <div className="Observers">
    <Container className={'p-3'}>
      <Table>
        <thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col">Home</th>
          <th scope="col">Away</th>
          <th scope="col">Seeking</th>
        </tr>
        </thead>
        <tbody>
        {observerList.length
          ? observerList.map((observer) => {
            return <Observer
              key={observer.id}
              id={observer.id}
              home={observer.home.name}
              away={observer.away.name}
              seek={observer.seek}
              updateSeek={updateSeek}
              socket={socket}
            />;
          })
          : <tr className="text-center table-warning">
            <td colSpan={4}><em>No observers yet.</em></td>
          </tr>
        }
        </tbody>
      </Table>
      <hr/>
      <Table>
        <thead>
        <tr>
          <th>Command</th>
          <th colSpan={2}>Parameters</th>
          <th>Example</th>
        </tr>
        </thead>
        <tbody>
        <tr>
          <th>find</th>
          <td>Handle <em>(White)</em></td>
          <td>Handle <em>(Black)</em></td>
          <td>find passersgg yourboykandy</td>
        </tr>
        <tr>
          <th>smoves</th>
          <td>Handle</td>
          <td>History ID</td>
          <td>smoves passersgg 1</td>
        </tr>
        <tr>
          <th>observe</th>
          <td>Handle</td>
          <td><em>N/A</em></td>
          <td>observe 123</td>
        </tr>
        <tr>
          <th>clear</th>
          <td><em>N/A</em></td>
          <td><em>N/A</em></td>
          <td>clear</td>
        </tr>
        </tbody>
      </Table>
    </Container>
  </div>;
}

function Observer(props) {
  const {id, home, away, seek, updateSeek} = props;

  return <tr>
    <th scope="row">{id}</th>
    <td>{home}</td>
    <td>{away}</td>
    <td>
      <ObserverSeekForm
        id={id}
        seek={seek}
        updateSeek={updateSeek}
      />
    </td>
  </tr>
}

export default Observers;
