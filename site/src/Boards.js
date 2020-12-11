import React, {useEffect, useState} from 'react';
import Board from './Board';
import './Board.css';

const totalBoardNumber = 4;

function Boards(props) {
  const {socket, currentMatchId} = props;

  const [pairings, setPairings] = useState([]);
  const loadPairings = (incomingPairings) => {
    if (incomingPairings.matchId !== currentMatchId) {
      return;
    }
    const parsedPairings = incomingPairings.pairings.reduce((gathered, pairing, i) => {
      const boardIndex = i % totalBoardNumber;
      if (!gathered[boardIndex]) {
        gathered[boardIndex] = {
          player: pairing.player,
          pairings: []
        };
      }
      gathered[boardIndex].pairings.push({
        opponentId: pairing.opponent.id,
        name: pairing.opponent.name,
        result: pairing.result,
        gameId: pairing.gameId,
        orientation: pairing.orientation
      });
      return gathered;
    }, []);
    setPairings(parsedPairings);
  };
  useEffect(() => {
    socket.emit('pairing:list', currentMatchId);
    socket.on('pairing:listed', loadPairings);
    return () => {
      socket.off('pairing:listed', loadPairings);
    };
  }, []);

  const requestPairingList = (data) => {
    if (data.matchId !== currentMatchId) {
      return;
    }
    socket.emit('pairing:list', currentMatchId);
  };
  useEffect(() => {
    socket.on('member:updated', requestPairingList);
    socket.on('opponent:updated', requestPairingList);
    socket.on('pairing:updated', requestPairingList);
    socket.on('player:selected', requestPairingList);
    return () => {
      socket.off('member:updated', requestPairingList);
      socket.off('opponent:updated', requestPairingList);
      socket.off('pairing:updated', requestPairingList);
      socket.off('player:selected', requestPairingList);
    };
  });

  return <div className="Boards">
    {pairings.map((item, i) => {
      return <Board
        key={i + 1}
        currentMatchId={currentMatchId}
        board={i + 1}
        player={item.player}
        rating={item.rating}
        pairings={item.pairings}
        socket={socket}
      />;
    })}
  </div>;
}

export default Boards;
 