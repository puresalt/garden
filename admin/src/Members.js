import React, {useEffect, useState} from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import ratingSort from 'gscc-common/src/ratingSort';
import LoadingOverlay from 'react-loading-overlay';
import LoadingOverlayText from './LoadingOverlayText';
import Players from './Players';

function Members(props) {
  const {socket} = props;

  const [isLoading, setIsLoading] = useState(true);
  const handleCreatedMember = (newMember) => {
    socket.emit('member:create', newMember);
  };

  const [members, setMembers] = useState([]);
  const handleMemberUpdate = (incomingMembers) => {
    const newMembers = [];
    members.forEach((newMember) => {
      incomingMembers.forEach((member, i) => {
        if (newMember.id === member.id) {
          newMembers[i] = {...newMember, ...member};
        }
      });
    });
    newMembers.sort(ratingSort);
    setMembers(newMembers);
    socket.emit('member:update', newMembers);
  };
  const handleMemberDelete = (memberId) => {
    socket.emit('member:delete', memberId);
  };
  const checkForMemberChanges = (data) => {
    setIsLoading(false);
    setMembers(data.members);
  };

  useEffect(() => {
    socket.emit('member:list');
    socket.on('member:listed', checkForMemberChanges);
    return () => {
      socket.off('member:listed', checkForMemberChanges);
    };
  }, []);

  return <div className="Members">
    <LoadingOverlay
      active={isLoading}
      className="loadingOverlay"
      text={<LoadingOverlayText/>}
    >
      <Row>
        <Col xs={4}>
          <AddMemberForm onSubmit={handleCreatedMember}
          />
        </Col>
        <Col><Players
          players={members}
          teamName="Garden State Chess Club"
          onSubmit={handleMemberUpdate}
          onDelete={handleMemberDelete}
        />
        </Col>
      </Row>
    </LoadingOverlay>
  </div>;
}

function AddMemberForm(props) {
  const {onSubmit} = props;

  const [name, setName] = useState();
  const handleNameChange = (event) => {
    setName(event.target.value);
  };
  const [lichessHandle, setLichessHandle] = useState();
  const handleLichessHandleChange = (event) => {
    setLichessHandle(event.target.value);
  };
  const [rating, setRating] = useState();
  const handleRatingChange = (event) => {
    setRating(event.target.value);
  };

  const handleAddMember = (event) => {
    event.preventDefault();
    onSubmit({
      rating: rating || null,
      name: name || null,
      lichessHandle: lichessHandle || null
    });
  };

  return <Form onSubmit={handleAddMember}>
    <Card>
      <Card.Header>
        Add New Member
      </Card.Header>
      <Card.Body>
        <Form.Group controlId="host">
          <Form.Label>Name</Form.Label>
          <Form.Control
            onChange={handleNameChange}
            placeholder="e.g. John Mullanaphy"
            defaultValue={name}
          />
        </Form.Group>
        <Form.Group controlId="host">
          <Form.Label>Lichess Handle</Form.Label>
          <Form.Control
            onChange={handleLichessHandleChange}
            placeholder="e.g. YourBoyKandy"
            defaultValue={lichessHandle}
          />
        </Form.Group>
        <Form.Group controlId="host">
          <Form.Label>Rating</Form.Label>
          <Form.Control
            type="number"
            min="0"
            max="9999"
            onChange={handleRatingChange}
            placeholder="e.g. 2083"
            defaultValue={rating}
          />
        </Form.Group>
      </Card.Body>
      <Card.Footer><Button type="submit">Create</Button></Card.Footer>
    </Card>
  </Form>
}

export default Members;
