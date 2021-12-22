const http = require('http');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const socketIo = require('socket.io');

const routes = [
  require('./route/stream')
];

function Router(redis, config) {
  const app = express();
  app.use(express.static(path.join(__dirname, 'public')));
  app.get('/', (req, res) => res.status(403).send(''));

  const server = http.createServer(app);
  const io = socketIo(server, {
    cors: false,
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
          console.info('input', name, JSON.stringify(...args, null, '\t'));
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
        console.info('broadcast', name, JSON.stringify(...args, null, '\t'));
        socket.broadcast.emit(name, ...args);
      },
      broadcastAll: (name, ...args) => {
        console.info('broadcastAll', name, JSON.stringify(...args, null, '\t'));
        io.sockets.emit(name, ...args);
      },
      emit: (name, ...args) => {
        console.info('emit', name, JSON.stringify(...args, null, '\t'));
        socket.emit(name, ...args);
      }
    };

    const disconnectCallbacks = routes.map(route => route(redis, socketWrapper));
    socket.on('disconnect', () => {
      disconnectCallbacks.forEach(c => c());
      const remainingCallbacks = Object.keys(callbacks);
      if (remainingCallbacks.length) {
        console.warn('Callbacks missing cleanup statements:', remainingCallbacks);
        remainingCallbacks.forEach(key => {
          const remainingCallback = callbacks[key];
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
