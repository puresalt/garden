const {CHESS_WHITE} = require('garden-common/src/constant');

module.exports = (pairingId, redis) => {
  const boardHash = `garden:${pairingId}`;
  const pairingHash = `${boardHash}:pairing`;
  const moveListHash = `${boardHash}:moveList`;
  return {
    pushPosition: (data, callback, type) => {
      redis.rpush(moveListHash, JSON.stringify({
        type: type || 'goto',
        data
      }), (err) => {
        if (err) {
          console.log('ERROR STORING:', data);
        }
        callback && callback(err);
      })
    },
    clearGameHistory: (callback) => {
      console.log('clearing history to look for:', white, black);
      this.pushPosition({
        fen: '8/8/8/8/8/8/8/8 w - - 0 1',
        clock: [null, null],
        moveList: [],
        moving: CHESS_WHITE,
        pauseClocks: true
      }, callback, 'start');
    },
    loopForUsernameChanges: (callback) => {
      let observing = null;
      process.nextTick(() => setInterval(() => {
        redis.get(pairingHash, (err, usernames) => {
          if (err) {
            console.warn('Error finding players, will try again in a bit:', err);
          }
          if (!usernames || observing === usernames) {
            return;
          }
          observing = usernames;
          callback(usernames);
        });
      }, 500));
    }
  };
};
