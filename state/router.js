const http = require('http');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const socketIo = require('socket.io');

const routes = [
  require('./route/match'),
  require('./route/player'),
  require('./route/pairing'),
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
    const callbacks = {};
    const socketWrapper = {
      on: (name, func) => {
        const eventName = eventListenerHash(name, func);
        callbacks[eventName] = [name, (...args) => {
          console.info(name, teamId, ...args);
          func(...args);
        }];
        socket.on(name, callbacks[eventName][1]);
      },
      off: (name, func) => {
        const eventName = eventListenerHash(name, func);
        const callback = callbacks[eventName][1];
        socket.off(name, callback);
        delete callbacks[eventName];
      },
      broadcast: (name, ...args) => {
        console.info(name, teamId, ...args);
        socket.broadcast.emit(name, ...args);
      },
      broadcastAll: (name, ...args) => {
        console.info(name, teamId, ...args);
        io.sockets.emit(name, ...args);
      },
      emit: (name, ...args) => {
        console.info(name, teamId, ...args);
        socket.emit(name, ...args);
      }
    };

    const disconnectCallbacks = routes.map(route => route(db, redis, socketWrapper, teamId));
    socket.on('disconnect', () => {
      disconnectCallbacks.forEach(c => c());
      const remainingCallbacks = Object.keys(callbacks);
      if (remainingCallbacks.length) {
        console.warn('Callbacks missing cleanup statements:', remainingCallbacks);
        remainingCallbacks.forEach(remainingCallback => {
          console.warn('remainingCallback:', remainingCallback[0]);
          socket.off(remainingCallback[0], remainingCallback[1]);
        })
      }
    });
  });

  server.listen(config.port.state, () => console.log(`Listening on port ${config.port.state}`));
}

function eventListenerHash(name, func) {
  return crypto.createHash('md5')
    .update(`${name}:${String(func)}`)
    .digest('hex');
}

module.exports = Router;
