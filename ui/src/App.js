import socketIoClient from 'socket.io-client';
import { Config } from 'garden-common';
import React from 'react';
import Board from './Board';
import './App.css';

const CONFIG = Config(process.env);
const socket = socketIoClient(CONFIG.socketIo.url, {
  path: '/admin'
});

const BOARDS = [1, 2, 3, 4, 5, 6, 7, 8];
Object.freeze(BOARDS);

function App() {
  return <div className="App">
    <div className="match fadeIn">
      <>
        {BOARDS.map((i) => {
          return <Board
            key={i}
            board={i}
            socket={socket}
          />;
        })}
      </>
    </div>
  </div>;
}

export default App;
