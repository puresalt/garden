module.exports = (redis) => {
  const STATE_KEY = 'rapid:stream:state';
  const STATE_KEYS = ['examineId', 'gameId', 'matchId'];
  const getState = (callback) => {
    redis.hgetall(STATE_KEY, (err, data) => {
      if (err) {
        return callback(err);
      }
      if (!data) {
        return callback(null, {});
      }
      const returnal = STATE_KEYS.reduce((gathered, key) => {
        gathered[key] = data[key]
          ? parseInt(data[key])
          : null;
        return gathered;
      }, {});
      returnal.isLive = data.isLive === '1';
      callback(null, returnal);
    });
  };
  const setState = (newData, callback) => {
    getState((err, data) => {
      const saveData = Object.assign({}, data, newData);
      const hset = STATE_KEYS.reduce((gathered, key) => {
        if (!saveData[key]) {
          saveData[key] = 0;
        }
        gathered.push(key, saveData[key]);
        return gathered;
      }, []);
      hset.push('isLive', saveData.isLive ? '1' : '0');
      redis.hset(STATE_KEY, hset, (err) => {
        if (err) {
          return callback(err, {});
        }
        callback(err, saveData);
      });
    });
  };

  return {
    STATE_KEY,
    setState,
    getState
  }
};
