import React, { useEffect, useState } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import LoadingOverlay from 'react-loading-overlay';
import LoadingOverlayText from './LoadingOverlayText';
import Table from 'react-bootstrap/Table';

function Players(props) {
  const {teamName, players, onSubmit} = props;

  return <div className="Players">
    <PlayerForm
      teamName={teamName}
      players={players}
      onSubmit={onSubmit}
    />
  </div>;
}

function PlayerForm(props) {
  const {isLoading, teamName, players, onSubmit} = props;

  const [average, setAverage] = useState(null);
  const [getTeamName, setTeamName] = useState(teamName);
  const [hasChanges, setHasChanges] = useState(false);
  const [data, setData] = useState({});
  const handleInput = (i, key, event) => {
    setHasChanges(true);
    const newData = {...data};
    if (!newData[i]) {
      newData[i] = {id: i};
    }
    newData[i][key] = event.target.value;
    if (key === 'rating') {
      const ratingSum = players.reduce((gathered, item) => {
        return gathered + (data[item.id] && data[item.id].rating ? parseInt(data[item.id].rating) : item.rating);
      }, 0);
      setAverage(Math.round(ratingSum / players.length * 100) / 100);
    }
    setData(newData);
  };
  const handleTeamName = (event) => {
    setHasChanges(true);
    setTeamName(event.target.value);
  };

  useEffect(() => {
    setTeamName(teamName);
  }, [teamName]);

  const processChanges = (event) => {
    event.preventDefault();
    const players = Object.keys(data).reduce((gathered, key) => {
      gathered.push(data[key]);
      return gathered;
    }, []);
    onSubmit(getTeamName, players);
    setHasChanges(false);
  };

  useEffect(() => {
    if (players.length) {
      const ratingSum = players.reduce((gathered, item) => gathered + item.rating, 0);
      setAverage(Math.round(ratingSum / players.length * 100) / 100);
    }
  }, [players]);

  return <LoadingOverlay active={isLoading} text={<LoadingOverlayText/>} spinner={false}>
    <Form onSubmit={processChanges}>
      <Form.Control
        placeholder="e.g. Garden State Passers"
        type="text"
        defaultValue={teamName}
        onChange={handleTeamName}
      />
      <hr/>
      <Table className="table-hover">
        <thead>
        <tr>
          <th scope="col">Name</th>
          <th scope="col">Handle</th>
          <th scope="col">Rating</th>
        </tr>
        </thead>
        <tbody>
        {players.map((player, i) => <tr key={i}>
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
              defaultValue={player.handle}
              onChange={(event) => handleInput(player.id, 'handle', event)}
            />
          </td>
          <td>
            <Form.Control
              placeholder="e.g. 2083"
              type="number"
              min={0}
              max={4000}
              defaultValue={player.rating}
              onChange={(event) => handleInput(player.id, 'rating', event)}
            />
          </td>
        </tr>)}
        </tbody>
        <tfoot>
        <tr>
          <th colSpan={2} scope="row">Team Average:</th>
          <td>{players.length > 1 ? average : <em>N/A</em>}</td>
        </tr>
        </tfoot>
      </Table>
      <Button type="submit" disabled={!hasChanges}>Save</Button>
    </Form>
  </LoadingOverlay>
}

export default Players;
