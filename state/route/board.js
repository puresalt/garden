const axios = require('axios');
const ChessBoard = require('chess.js').Chess;
const StringDecoder = require('string_decoder').StringDecoder;
const stringDecoder = new StringDecoder('utf8');

function BoardRoute(dataStore, io, socket, teamId, config) {
  //const personalToken = config.lichess.personalToken;
  //const headers = {'Authorization': `Bearer ${personalToken}`};
  const headers = {'Accept': 'application/json', 'Content-Type': 'text/plain'};

  function getGames() {
    axios.post(`/api/stream/games-by-users`, 'chessajedrezz2020,chessajedrezz2020,zanayer,AAAel', {
      baseURL: 'https://lichess.org/',
      headers: headers,
      responseType: 'stream'
    }).then((response) => {
        response.data
          .on('data', data => console.log('DATA:', stringDecoder.write(data)))
      },
      err => console.error(err.message)
    );
  }

  function getGame(gameId) {
    const chessBoard = new ChessBoard();
    let history = [];
    let lastPgn = null;
    checkState();

    function checkState() {
      axios.get(`/game/export/${gameId}`, {
        baseURL: 'https://lichess.org/',
        headers: {Accept: 'application/json'},
        requestType: 'json',
        params: {
          pgnInJson: true,
          clocks: true,
          opening: false,
          literate: false,
          tags: false,
          moves: true
        }
      }).then(response => {
          if (lastPgn === null) {
            chessBoard.load_pgn(this.data.pgn);
            history = chessBoard.history();
          } else if (lastPgn.length !== this.data.pgn.length) {
            const newPgnMoves = this.data.pgn.substr(lastPgn.length);
            
          }
          if (response.data.status === 'started') {
            setTimeout(() => getGame(gameId, board), 100);
          }
        },
        err => console.error(err.message)
      );
    }
  }

  function example() {
    socket.emit('board:1', {type: 'move', from: 'e2', to: 'e4'});
    setTimeout(_ => socket.emit('board:1', {type: 'movePiece', data: ['e2', 'e4']}), 100);
    setTimeout(_ => socket.emit('board:1', {type: 'movePiece', data: ['e7', 'e5']}), 200);
    setTimeout(_ => socket.emit('board:1', {type: 'movePiece', data: ['b1', 'c3']}), 300);
    setTimeout(_ => socket.emit('board:1', {type: 'movePiece', data: ['g8', 'f6']}), 500);
    setTimeout(_ => socket.emit('board:1', {type: 'drawArrow', data: [{orig: 'e2', dest: 'e4', brush: 'green'}]}), 700);
    setTimeout(_ => socket.emit('board:1', {
      type: 'drawArrow',
      data: [{orig: 'e2', dest: 'e4', brush: 'green'}, {orig: 'e7', dest: 'e5', brush: 'blue'}]
    }), 900);
    setTimeout(_ => socket.emit('board:1', {type: 'startBoard', data: {}}), 5000);
    return () => {
    };
  }

  //getGame('pv3AkAtz');
  //getGame('pv3AkAtz');
  // getGame('pv3AkAtz');
  //getGame('pv3AkAtz');

}

BoardRoute();

module.exports = BoardRoute;
