const _getKey = require('./key');

const COMPLETE_LIST = [0, -1];
Object.freeze(COMPLETE_LIST);

const cleanRecord = (item) => {
  item.rating = item.rating
    ? Number(item.rating)
    : 0;
  item.name = item.name || '';
  item.username = item.username || '';
  return item;
};

const fill = (data) => {
  const returnData = [];
  for (let i = 0, count = data.length; i < count; ++i) {
    returnData.push(data[i]);
  }
  for (let i = data.length; i < 4; ++i) {
    returnData.push(cleanRecord({}));
  }
  return returnData;
};

module.exports = {
  fill,
  cleanRecord,
  getKey: (accountId) => {
    return (matchId) => _getKey(accountId, 'player', matchId || 0);
  },

  findAll(dataStore, accountId, matchId, callback) {
    const id = this.getKey(accountId)(matchId);
    const playerKey = `${id}:player`;
    const opponentKey = `${id}:opponent`;
    dataStore.lrange(playerKey, COMPLETE_LIST, (err, playerData) => {
      if (err) {
        return callback(err);
      }
      dataStore.lrange(opponentKey, COMPLETE_LIST, (err, opponentData) => {
        if (err) {
          return callback(err);
        }
        callback(null, {
          player: fill(playerData.map(JSON.parse)),
          opponent: fill(opponentData.map(JSON.parse))
        });
      });
    });
  }
};