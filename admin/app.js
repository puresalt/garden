const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 4004;
const DATA_DIRECTORY = path.join(__dirname, '../src/data');
const WATCH_FILE_COLLECTION = ['config', 'results'];
const index = require('./routes/index');

const app = express();
app.use(index);

const server = http.createServer(app);
const io = socketIo(server);

io.on('connection', socket => {
  WATCH_FILE_COLLECTION.forEach(item => emitFileData(socket, item + '.json'));
  const watchingCollection = WATCH_FILE_COLLECTION
    .map(
      item => fs.watch(
        path.join(DATA_DIRECTORY, item + '.json'),
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

