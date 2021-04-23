import React, { useEffect, useState } from 'react';
import Table from 'react-bootstrap/Table';
import Container from 'react-bootstrap/Container';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import ToggleButton from 'react-bootstrap/ToggleButton';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';

function Observers(props) {
  const {socket, section} = props;

  const start = (section * 4) - 4;
  const end = start + 4;

  const [observerList, setObserverList] = useState([]);
  const updateObserverList = (incomingObserverList) => {
    setObserverList(incomingObserverList.slice(start, end));
  };

  const updateSeek = (id, seek) => {
    console.log('huh?', id, seek);
    socket.emit('observer:update', id, seek);
  };
  const [board1, setBoard1] = useState(0);
  const [board2, setBoard2] = useState(0);
  const [board3, setBoard3] = useState(0);
  const [board4, setBoard4] = useState(0);
  const setBoard = [setBoard1, setBoard2, setBoard3, setBoard4];
  const updateBoard = (id, pairingId) => {
    setBoard[id - 1](pairingId);
    socket.emit('observer:pick', id + start, pairingId);
  };

  const [pairingList, setPairingList] = useState([]);
  const updatePairingList = (incomingPairingList) => {
    setPairingList(incomingPairingList);
    incomingPairingList.forEach((pairing) => pairing.observerBoardId && setBoard[pairing.observerBoardId - 1 - start](pairing.id));
  };

  useEffect(() => {
    socket.emit('pairing:list', section);
    socket.on('pairing:listed', updatePairingList);
    socket.emit('observer:list');
    socket.on('observer:listed', updateObserverList);
    return () => {
      socket.off('pairing:listed', updatePairingList);
      socket.off('observer:listed', updateObserverList);
    }
  }, []);

  return <div className="Observers">
    <Container className={'p-3'}>
      <Row>
        <Col lg={3}>
          <Table size="sm">
            <thead>
            <tr >
              <th scope="col">#</th>
              <th scope="col">Seeking</th>
            </tr>
            </thead>
            <tbody>
            {observerList.length
              ? observerList.map((observer) => {
                return <Observer
                  key={observer.id}
                  id={observer.id}
                  seek={observer.seek}
                  updateSeek={updateSeek}
                  socket={socket}
                />;
              })
              : <tr className="text-center table-warning">
                <td colSpan={2}><em>No observers yet.</em></td>
              </tr>
            }
            </tbody>
          </Table>
        </Col>
        <Col>
          <Table size="sm">
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
              <th>board</th>
              <td>Board Number</td>
              <td><em>N/A</em></td>
              <td>board 1</td>
            </tr>
            <tr>
              <th>uscf</th>
              <td>USCF ID</td>
              <td><em>N/A</em></td>
              <td>uscf 12639202</td>
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
        </Col>
        <hr/>
      </Row>
      <Row>
        <Table>
          <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">White</th>
            <th scope="col">Black</th>
            <th scope="col">Live Stream</th>
          </tr>
          </thead>
          <tbody>
          {pairingList.length
            ? pairingList.map((pairing) => {
              return <Pairing
                key={pairing.id}
                start={start}
                id={pairing.id}
                boardId={pairing.boardId}
                board1={board1}
                board2={board2}
                board3={board3}
                board4={board4}
                home={pairing.home}
                away={pairing.away}
                seek={pairing.seek}
                updateBoard={updateBoard}
                pairingId={pairing.pairingId}
                socket={socket}
              />;
            })
            : <tr className="text-center table-warning">
              <td colSpan={4}><em>No pairings yet.</em></td>
            </tr>
          }
          </tbody>
        </Table>
      </Row>
    </Container>
  </div>;
}

function Pairing(props) {
  const {start, id, boardId, home, away, board1, board2, board3, board4, updateBoard} = props;

  const handleUpdateBoard = (observerBoardId) => updateBoard(observerBoardId, id);

  return <tr>
    <th scope="row">{boardId}</th>
    <td>{home.name} <em><small>({home.rating})</small></em></td>
    <td>{away.name} <em><small>({away.rating})</small></em></td>
    <td>
      <ObserversBoardPicker
        start={start}
        pairingId={id}
        board1={board1}
        board2={board2}
        board3={board3}
        board4={board4}
        handleUpdateBoard={handleUpdateBoard}
      />
    </td>
  </tr>;
}

function ObserversBoardPicker(props) {
  const {start, board1, board2, board3, board4, pairingId, handleUpdateBoard} = props;

  const handleChange = (event) => {
    handleUpdateBoard(Number(event.target.value), pairingId);
  };

  const isActive = pairingId === board1 || pairingId === board2 || pairingId === board3 || pairingId === board4;

  return <ButtonGroup toggle>
    <ToggleButton
      checked={pairingId === board1}
      disabled={isActive}
      type="radio"
      value={1}
      onChange={handleChange}
      variant={pairingId === board1 ? "success" : "secondary"}>{1 + start}</ToggleButton>
    <ToggleButton
      checked={pairingId === board2}
      disabled={isActive}
      type="radio"
      value={2}
      onChange={handleChange}
      variant={pairingId === board2 ? "success" : "secondary"}>{2 + start}</ToggleButton>
    <ToggleButton
      checked={pairingId === board3}
      disabled={isActive}
      type="radio"
      value={3}
      onChange={handleChange}
      variant={pairingId === board3 ? "success" : "secondary"}>{3 + start}</ToggleButton>
    <ToggleButton
      checked={pairingId === board4}
      disabled={isActive}
      type="radio"
      value={4}
      onChange={handleChange}
      variant={pairingId === board4 ? "success" : "secondary"}>{4 + start}</ToggleButton>
  </ButtonGroup>;
}

function Observer(props) {
  const {id, seek, updateSeek} = props;

  return <tr>
    <th scope="row">{id}</th>
    <td>
      <ObserverSeekForm
        id={id}
        seek={seek}
        updateSeek={updateSeek}
      />
    </td>
  </tr>;
}

function ObserverSeekForm(props) {
  const {id, seek, updateSeek} = props;

  const [newSeek, setNewSeek] = useState(seek);
  const [seekChanged, setSeekChanged] = useState(false);
  const handleChange = (event) => {
    setSeekChanged(true);
    setNewSeek(event.target.value.toLowerCase());
  };
  const handleSubmit = (event) => {
    event.preventDefault();
    if (!seekChanged) {
      return;
    }
    updateSeek(id, newSeek);
    setSeekChanged(false);
  };

  return <Form onSubmit={handleSubmit} key={seek}>
    <InputGroup>
      <Form.Control
        placeholder="Seek Data"
        type="text"
        defaultValue={seek}
        onChange={handleChange}
      />
      <InputGroup.Append>
        <Button
          type="submit"
          variant="primary"
          disabled={!seekChanged}>Set</Button>
      </InputGroup.Append>
    </InputGroup>
  </Form>;
}

export default Observers;
