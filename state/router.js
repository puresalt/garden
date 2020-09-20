const http = require('http');
const path = require('path');
const express = require('express');
const socketIo = require('socket.io');

const teamId = 1;

function Router(dataStore, config) {
  const app = express();
  app.use(express.static(path.join(__dirname, 'public')));
  app.get('/', (req, res) => res.status(403).send(''));

  const server = http.createServer(app);
  const adminIo = socketIo(server, {
    path: '/admin'
  });
  if (config.socketIo.allowedOrigins) {
    adminIo.origins(config.socketIo.allowedOrigins);
  }
  const adminMatchRoute = require('./route/admin/match');
  const adminPlayerRoute = require('./route/admin/player');
  const adminPairingRoute = require('./route/admin/pairing');
  adminIo.on('connection', (socket) => {
    const disconnectCallbacks = [
      adminMatchRoute(dataStore, adminIo, socket, teamId),
      adminPlayerRoute(dataStore, adminIo, socket, teamId),
      adminPairingRoute(dataStore, adminIo, socket, teamId)
    ];
    socket.on('disconnect', () => disconnectCallbacks.forEach(c => c()));
  });

  const boardIo = socketIo(server, {
    path: '/board'
  });
  if (config.socketIo.allowedOrigins) {
    boardIo.origins(config.socketIo.allowedOrigins);
  }
  const boardRoute = require('./route/board');
  boardIo.on('connection', (socket) => {
    const disconnectCallback = boardRoute(dataStore, boardIo, socket, teamId);
    socket.on('disconnect', () => disconnectCallback());
  });

  server.listen(config.port.state, () => console.log(`Listening on port ${config.port.state}`));
}

module.exports = Router;
