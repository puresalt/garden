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

const sections = {
  'K-12': 1,
  'K-9': 2,
  'K-6': 3,
  'K-5': 4,
  'K-3': 5,
  'K-1': 6
};

function Observers(props) {
  const {socket, section} = props;
  const sectionId = sections[section];

  const [observerList, setObserverList] = useState([]);
  const updateObserverList = (incomingObserverList) => {
    setObserverList([incomingObserverList[sectionId - 1], ...(incomingObserverList.slice(4, 8))]);
  };

  const [analysisBoard1, setAnalysisBoard1] = useState(0);
  const [analysisBoard2, setAnalysisBoard2] = useState(0);
  const setAnalysisBoard = [setAnalysisBoard1, setAnalysisBoard2];
  const updateAnalysisBoard = (id, pairingId) => {
    setAnalysisBoard[id - 7](pairingId);
    socket.emit('observer:pick', id, pairingId);
  };

  const [observingPairingId, setObservingPairingId] = useState(0);
  const updateBoard = (pairingId) => {
    setObservingPairingId(pairingId);
    socket.emit('observer:pick', sectionId, pairingId);
  };

  const updateSeek = (id, seek) => {
    socket.emit('observer:update', id, seek);
  };

  const [pairingList, setPairingList] = useState([]);
  const updatePairingList = (incomingPairingList) => {
    setPairingList(incomingPairingList);
    incomingPairingList.forEach((pairing) => {
      if (!pairing.observerBoardId) {
        return;
      }
      if (pairing.observerBoardId < 7) {
        setObservingPairingId(pairing.id)
      } else {
        setAnalysisBoard[pairing.observerBoardId - 7](pairing.id);
      }
    });
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
            <tr>
              <th scope="col">#</th>
              <th scope="col">Seeking</th>
            </tr>
            </thead>
            <tbody>
            {observerList.length
              ? observerList.map((observer, index) => {
                return <Observer
                  key={index}
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
            <th scope="col">Live Board</th>
            <th scope="col">Analysis Board</th>
          </tr>
          </thead>
          <tbody>
          {pairingList.length
            ? pairingList.map((pairing) => {
              return <Pairing
                key={pairing.id}
                id={pairing.id}
                boardId={pairing.boardId}
                observingPairingId={observingPairingId}
                home={pairing.home}
                away={pairing.away}
                seek={pairing.seek}
                analysisBoard1={analysisBoard1}
                analysisBoard2={analysisBoard2}
                updateBoard={updateBoard}
                updateAnalysisBoard={updateAnalysisBoard}
                pairingId={pairing.pairingId}
                socket={socket}
              />;
            })
            : <tr className="text-center table-warning">
              <td colSpan={5}><em>No pairings yet.</em></td>
            </tr>
          }
          </tbody>
        </Table>
      </Row>
    </Container>
  </div>;
}

function Pairing(props) {
  const {
    id,
    boardId,
    home,
    away,
    observingPairingId,
    updateBoard,
    analysisBoard1,
    analysisBoard2,
    updateAnalysisBoard
  } = props;

  const isActive = id === observingPairingId || id === analysisBoard1 || id === analysisBoard2;

  return <tr>
    <th scope="row">{boardId}</th>
    <td>{home.name} <em><small>({home.rating})</small></em></td>
    <td>{away.name} <em><small>({away.rating})</small></em></td>
    <td>
      <ObserversBoardPicker
        pairingId={id}
        isActive={isActive}
        observingPairingId={observingPairingId}
        updateBoard={updateBoard}
      />
    </td>
    <td>
      <AnalysisBoardPicker
        pairingId={id}
        analysisBoard1={analysisBoard1}
        analysisBoard2={analysisBoard2}
        observingPairingId={observingPairingId}
        isActive={isActive}
        updateAnalysisBoard={updateAnalysisBoard}
      />
    </td>
  </tr>;
}

function ObserversBoardPicker(props) {
  const {isActive, observingPairingId, pairingId, updateBoard} = props;

  return <Button
    disabled={isActive}
    onClick={() => updateBoard(pairingId)}
    variant={pairingId === observingPairingId ? "success" : "primary"}><i className="fa fa-eye"/></Button>;
}

function AnalysisBoardPicker(props) {
  const {
    isActive,
    analysisBoard1,
    analysisBoard2,
    pairingId,
    updateAnalysisBoard
  } = props;

  const handleChange = (event) => {
    updateAnalysisBoard(Number(event.target.value), pairingId);
  };

  return <ButtonGroup toggle>
    <ToggleButton
      checked={pairingId === analysisBoard1}
      disabled={isActive}
      type="radio"
      value={7}
      onChange={handleChange}
      variant={pairingId === analysisBoard1 ? "success" : "secondary"}>1</ToggleButton>
    <ToggleButton
      checked={pairingId === analysisBoard2}
      disabled={isActive}
      type="radio"
      value={8}
      onChange={handleChange}
      variant={pairingId === analysisBoard2 ? "success" : "secondary"}>2</ToggleButton>
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
