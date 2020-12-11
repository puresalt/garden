import React, {useEffect, useState} from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Table from 'react-bootstrap/Table';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import LoadingOverlay from 'react-loading-overlay';
import LoadingOverlayText from './LoadingOverlayText';
import OrDefault from 'garden-common/react/OrDefault';
import {useHistory} from 'react-router-dom';
import Settings from './Settings';

function Matches(props) {
  const {socket, currentMatchId, updateCurrentMatchId, updateCurrentOpponent, stateLookup} = props;

  const history = useHistory();

  const createNewMatch = (data) => {
    socket.emit('match:create', data);
  };

  const addNewMatch = (data) => {
    updateCurrentOpponent(data.opponent);
    updateCurrentMatchId(data.id);
    history.push('/dashboard');
  };
  useEffect(() => {
    socket.on('match:created', addNewMatch);
    return () => {
      socket.off('match:created', addNewMatch);
    }
  }, []);

  return <div className="Matches">
    <Row>
      <Col xs={4}>
        <Settings
          socket={socket}
          stateLookup={stateLookup}
          onSubmit={createNewMatch}
          updateCurrentMatchId={updateCurrentMatchId}
          updateCurrentOpponent={updateCurrentOpponent}
        />
      </Col>
      <Col>
        <MatchList
          socket={socket}
          currentMatchId={currentMatchId}
          stateLookup={stateLookup}
          updateCurrentMatchId={updateCurrentMatchId}
          updateCurrentOpponent={updateCurrentOpponent}
        />
      </Col>
    </Row>
  </div>;
}

function MatchList(props) {
  const {socket, currentMatchId, stateLookup, updateCurrentMatchId, updateCurrentOpponent} = props;

  const [matches, setMatches] = useState([]);
  const checkForDeletedMatches = (deletedMatchId) => {
    if (deletedMatchId === currentMatchId) {
      const mostRecentMatch = matches.length
        ? matches[matches.length - 1]
        : false;
      if (mostRecentMatch) {
        updateCurrentMatchId(mostRecentMatch.id);
        updateCurrentOpponent(mostRecentMatch.opponent);
      } else {
        updateCurrentMatchId(0);
        updateCurrentOpponent('');
      }
    }
    socket.emit('match:list');
    setIsLoading(true);
  };

  const [isLoading, setIsLoading] = useState(true);
  const [potentialDeletedMatchId, setPotentialDeletedMatchId] = useState(0);
  const handlePotentialDeleteMatchId = (matchId) => {
    setPotentialDeletedMatchId(matchId);
  };
  const handleDeleteMatchId = () => {
    deleteMatch(potentialDeletedMatchId);
    setPotentialDeletedMatchId(0);
  };
  const handleClose = () => {
    setPotentialDeletedMatchId(0);
  };

  const deleteMatch = (matchId) => {
    socket.emit('match:delete', matchId);
  };

  const checkForMatchUpdates = (newMatches) => {
    setIsLoading(false);
    setMatches(newMatches);
    if (!currentMatchId && newMatches.length) {
      updateCurrentMatchId(newMatches[newMatches.length - 1].id);
    }
  };
  useEffect(() => {
    socket.emit('match:list');
    socket.on('match:listed', checkForMatchUpdates);
    socket.on('match:deleted', checkForDeletedMatches);
    return () => {
      socket.off('match:listed', checkForMatchUpdates);
      socket.off('match:deleted', checkForDeletedMatches);
    }
  }, []);

  return <div className="MatchList">
    <LoadingOverlay
      active={isLoading}
      className="loadingOverlay"
      text={<LoadingOverlayText/>}
    >
      <h4>Saved Matches</h4>
      <Modal show={potentialDeletedMatchId > 0} onHide={handleClose} animation={false}>
        <Modal.Header closeButton>
          <Modal.Title>Woah!</Modal.Title>
        </Modal.Header>
        <Modal.Body>You're totally about to delete Match #{potentialDeletedMatchId}?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button variant="danger" onClick={handleDeleteMatchId}>Delete!</Button>
        </Modal.Footer>
      </Modal>
      <Table>
        <thead>
        <tr>
          <td>#</td>
          <td>Opponent</td>
          <td/>
        </tr>
        </thead>
        <tbody>
        {
          matches.length
            ? matches.map((match, i) => {
              const isCurrentMatch = match.id === currentMatchId;
              return <tr key={i} className={isCurrentMatch ? 'table-primary' : ''}>
                <td>{match.id}</td>
                <td><OrDefault value={stateLookup[match.opponent]}/></td>
                <td className="text-right">
                  <ButtonGroup size="sm">
                    {
                      !isCurrentMatch
                        ?
                        <Button variant="primary" onClick={() => updateCurrentMatchId(match.id)}>Manage</Button>
                        : ''
                    }
                    <Button variant="danger" onClick={() => handlePotentialDeleteMatchId(match.id)}>Delete</Button>
                  </ButtonGroup>
                </td>
              </tr>;
            })
            : <tr className="table-warning">
              <td colSpan={3}><em>Nope, no matches here dude/dudette.</em></td>
            </tr>
        }
        </tbody>
      </Table>
    </LoadingOverlay>
  </div>;
}

export default Matches;
