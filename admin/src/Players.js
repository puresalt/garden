import React, {useState} from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import OrDefault from 'gscc-common/react/OrDefault';
import LoadingOverlay from 'react-loading-overlay';
import LoadingOverlayText from './LoadingOverlayText';
import Table from 'react-bootstrap/Table';
import Modal from 'react-bootstrap/Modal';

function Players(props) {
  const {players, teamName, onSubmit, onDelete} = props;

  return <div className="Players">
    <h4><OrDefault value={teamName}/></h4>
    <PlayerForm
      players={players}
      onSubmit={onSubmit}
      onDelete={onDelete}
    />
  </div>;
}

function PlayerForm(props) {
  const {isLoading, players, onSubmit, onDelete} = props;

  const [hasChanges, setHasChanges] = useState(false);
  const [data, setData] = useState({});
  const handleInput = (i, key, event) => {
    setHasChanges(true);
    if (!data[i]) {
      data[i] = {id: i};
    }
    data[i][key] = event.target.value;
    setData(data);
  };

  const processChanges = (event) => {
    event.preventDefault();
    onSubmit(Object.keys(data).reduce((gathered, key) => {
      gathered.push(data[key]);
      return gathered;
    }, []));
    setHasChanges(false);
  };

  const [potentialDeletedPlayer, setPotentialDeletedPlayer] = useState(null);
  const handleDeletePlayer = () => {
    onDelete(potentialDeletedPlayer.id);
    setPotentialDeletedPlayer(null);
  };
  const handleClose = () => {
    setPotentialDeletedPlayer(null);
  };

  const hasPlayers = players.length;
  return <LoadingOverlay active={isLoading} text={<LoadingOverlayText/>} spinner={false}>
    <Modal show={potentialDeletedPlayer !== null} onHide={handleClose} animation={false}>
      <Modal.Header closeButton>
        <Modal.Title>Woah!</Modal.Title>
      </Modal.Header>
      <Modal.Body>You're totally about to
        delete <strong>{potentialDeletedPlayer !== null ? potentialDeletedPlayer.name || potentialDeletedPlayer.username || 'Someone Unnamed' : ''}</strong>?</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>Cancel</Button>
        <Button variant="danger" onClick={handleDeletePlayer}>Delete!</Button>
      </Modal.Footer>
    </Modal>
    <Form onSubmit={processChanges}>
      <Table className="table-hover">
        <thead>
        <tr>
          <th scope="col">Name</th>
          <th scope="col">Lichess Handle</th>
          <th scope="col">Rating</th>
          {onDelete ? <th scope="col"/> : <></>}
        </tr>
        </thead>
        <tbody>
        {
          hasPlayers
            ? players.map((player) => <tr key={player.id}>
              <td>
                <Form.Control
                  placeholder="e.g. John Mullanaphy"
                  type="text"
                  defaultValue={player.name}
                  onChange={(event) => handleInput(player.id, 'name', event)}
                />
              </td>
              <td>
                <Form.Control
                  placeholder="e.g. YourBoyKandy"
                  type="text"
                  defaultValue={player.lichessHandle}
                  onChange={(event) => handleInput(player.id, 'lichessHandle', event)}
                />
              </td>
              <td>
                <Form.Control
                  placeholder="e.g. 2083"
                  type="number"
                  min={0}
                  max={3000}
                  defaultValue={player.rating}
                  onChange={(event) => handleInput(player.id, 'rating', event)}
                />
              </td>
              {onDelete ?
                <td><Button variant="danger" onClick={() => setPotentialDeletedPlayer(player)}>Delete</Button>
                </td> : <></>}
            </tr>)
            : <tr>
              <td colSpan={onDelete ? 4 : 3}>No players currently added.</td>
            </tr>
        }
        </tbody>
      </Table>
      {hasPlayers ? <Button type="submit" disabled={!hasChanges}>Save</Button> : ''}
    </Form>
  </LoadingOverlay>
}

export default Players;
