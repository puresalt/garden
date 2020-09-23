const http = require('http');
const path = require('path');
const express = require('express');
const socketIo = require('socket.io');

const routes = [
  require('./route/match'),
  require('./route/player'),
  require('./route/pairing'),
  require('./route/viewer'),
  require('./route/board')
];

const teamId = 1;

function Router(db, redis, config) {
  const app = express();
  app.use(express.static(path.join(__dirname, 'public')));
  app.get('/', (req, res) => res.status(403).send(''));

  const server = http.createServer(app);
  const io = socketIo(server, {
    path: '/admin'
  });
  if (config.socketIo.allowedOrigins) {
    io.origins(config.socketIo.allowedOrigins);
  }
  io.on('connection', (socket) => {
    const disconnectCallbacks = routes.map(route => route(db, redis, io, socket, teamId));
    socket.on('disconnect', () => disconnectCallbacks.forEach(c => c()));
  });

  server.listen(config.port.state, () => console.log(`Listening on port ${config.port.state}`));
}

module.exports = Router;
