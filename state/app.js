const http = require('http');
const fs = require('fs');
const path = require('path');
const express = require('express');
const socketIo = require('socket.io');
const common = require('gcss-common');
const config = common.Config(process.env, require(path.join(__dirname, '../common/config/runtime.json')));

const PORT = process.env.PORT || 4003;
const DATA_DIRECTORY = path.join(__dirname, '../common/data');
const WATCH_FILE_COLLECTION = ['config.json', 'results.json'];

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res, next) => res.status(403).send(''));

const server = http.createServer(app);
const io = socketIo(server);

if (config.socketIo.allowedOrigins) {
  io.origins(config.socketIo.allowedOrigins);
}

io.on('connection', socket => {
  WATCH_FILE_COLLECTION.forEach(item => emitFileData(socket, item));
  socket.emit('board-1', {type: 'move', from: 'e2', to: 'e4'});
  setTimeout(_ => socket.emit('board-1', {type: 'movePiece', data: ['e2', 'e4']}), 100);
  setTimeout(_ => socket.emit('board-1', {type: 'movePiece', data: ['e7', 'e5']}), 200);
  setTimeout(_ => socket.emit('board-1', {type: 'movePiece', data: ['b1', 'c3']}), 300);
  setTimeout(_ => socket.emit('board-1', {type: 'movePiece', data: ['g8', 'f6']}), 500);
  setTimeout(_ => socket.emit('board-1', {type: 'drawArrow', data: [{orig: 'e2', dest: 'e4', brush: 'green'}]}), 700);
  setTimeout(_ => socket.emit('board-1', {type: 'drawArrow', data: [{orig: 'e2', dest: 'e4', brush: 'green'}, {orig: 'e7', dest: 'e5', brush: 'blue'}]}), 900);
  setTimeout(_ => socket.emit('board-1', {type: 'startBoard', data: {}}), 5000);
  const watchingCollection = WATCH_FILE_COLLECTION
    .map(
      item => fs.watch(
        path.join(DATA_DIRECTORY, item),
        (eventType, fileName) => emitFileData(socket, fileName)
      )
    );
  socket.on('disconnect', () => watchingCollection.forEach(watcher => watcher.close()));
});

server.listen(PORT, () => console.log(`Listening on port ${PORT}`));

function emitFileData(socket, fileName) {
  fs.readFile(path.join(DATA_DIRECTORY, fileName), 'utf8', (err, data) => {
    if (err) {
      console.warn(err);
      return;
    }
    try {
      if (!data || !data.length || !Object.keys(data).length) {
        return;
      }
      socket.emit(fileName.replace('.json', ''), JSON.parse(data));
    } catch (e) {
      console.warn('Error reading data:', fileName.replace('.json', ''), data, e);
    }
  });
}
