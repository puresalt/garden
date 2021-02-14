import React, { useEffect, useState } from 'react';
import Table from 'react-bootstrap/Table';
import LoadingOverlay from 'react-loading-overlay';
import LoadingOverlayText from './LoadingOverlayText';
import './Pairings.css';
import Button from 'react-bootstrap/Button';

function isOdd(num) {
  return num % 2 === 1;
}

function Pairings(props) {
  const {socket, watchedPairing, handleWatchedPairing} = props;

  const [isLoading, setIsLoading] = useState(true);
  const [pairingList, setPairingList] = useState([]);
  const updateList = (incomingPairingList) => {
    setIsLoading(false);
    setPairingList(incomingPairingList);
  };

  useEffect(() => {
    setIsLoading(true);
    socket.emit('pairing:list');
    socket.on('pairing:listed', updateList);
    return () => {
      socket.off('pairing:listed', updateList);
    }
  }, []);

  return <div className="Pairings">
    <LoadingOverlay active={isLoading} spinner={false} text={<LoadingOverlayText/>}>
      <Table className="table-hover">
        <thead>
        <tr>
          <th scope="col">Board</th>
          <th/>
          <th scope="col">Home Team</th>
          <th/>
          <th scope="col">Away Team</th>
        </tr>
        </thead>
        <tbody>
        {pairingList.map((pairing) => {
          return <Pairing
            home={pairing.home}
            away={pairing.away}
            matchUps={pairing.matchUps}
            watching={watchedPairing === pairing.id}
            handleWatchMatch={() => handleWatchedPairing(pairing.id)}
            key={pairing.id}
          />;
        })}
        </tbody>
      </Table>
    </LoadingOverlay>
  </div>;
}

function Pairing(props) {
  const {home, away, matchUps, watching, handleWatchMatch} = props;

  return <>
    <tr className="table-secondary">
      <th>
        <Button disabled={watching} onClick={handleWatchMatch}>Observe</Button>
      </th>
      <th colSpan={2}>{home || <em>Unnamed Team</em>}</th>
      <th colSpan={2}>{away || <em>Unnamed Team</em>}</th>
    </tr>
    {matchUps.map((matchUp, i) => {
      return <MatchUp
        key={i}
        board={matchUp.board}
        home={matchUp.home}
        away={matchUp.away}
      />;
    })}
  </>;
}

function MatchUp(props) {
  const {board, home, away} = props;

  const homePlayer = <>{(home && (home.name || home.handle)) || 'Someone Unnamed'}
    <em>({(home && home.rating) || '???'})</em></>;
  const awayPlayer = <>{(away && (away.name || away.handle)) || 'Someone Unnamed'}
    <em>({(away && away.rating) || '???'})</em></>;

  let homeColor;
  let awayColor;
  if (isOdd(board)) {
    homeColor = <td className="white">W</td>;
    awayColor = <td className="black">B</td>;
  } else {
    homeColor = <td className="black">B</td>;
    awayColor = <td className="white">W</td>;
  }

  return <tr>
    <th scope="row">{board}</th>
    {homeColor}
    <td>{homePlayer}</td>
    {awayColor}
    <td>{awayPlayer}</td>
  </tr>;
}

export default Pairings;
