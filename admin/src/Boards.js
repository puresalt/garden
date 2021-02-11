import React, { useEffect, useState } from 'react';
import Board from './Board';
import './Board.css';

function Boards(props) {
  const {socket} = props;

  const [pairingList, setPairingList] = useState([]);
  const updateList = (pairingList) => {
    setPairingList(pairingList);
  };

  useEffect(() => {
    socket.emit('stream:board:list');
    socket.on('stream:board:listed', updateList);
    return () => {
      socket.off('stream:board:listed', updateList);
    }
  }, []);

  return <div className="Boards">
    {pairingList.map((pairing, i) => {
      return <Board
        key={i}
        pairing={pairing}
        socket={socket}
      />;
    })}
  </div>;
}

export default Boards;
