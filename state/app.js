const http = require('http');
const fs = require('fs');
const path = require('path');
const express = require('express');
const socketIo = require('socket.io');
const common = require('gcss-common');
const config = common.Config(process.env, require(path.join(__dirname, '../common/config/runtime.json')));

const PORT = process.env.PORT || 4003;

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
const adminRoute = require('./route/admin');
const adminPlayerRoute = require('./route/admin/player');
adminIo.on('connection', (socket) => {
  const disconnectCallbacks = [
    adminRoute(adminIo, socket),
    adminPlayerRoute(adminIo, socket)
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
  const disconnectCallback = boardRoute(boardIo, socket);
  socket.on('disconnect', () => disconnectCallback());
});

server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
