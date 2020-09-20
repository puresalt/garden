const _getKey = require('./key');

const matchUps = [
  [0, 3],
  [1, 2],
  [2, 1],
  [3, 0],
  [0, 2],
  [1, 3],
  [2, 0],
  [3, 1],
  [0, 1],
  [1, 0],
  [2, 3],
  [3, 2],
  [0, 0],
  [1, 1],
  [2, 2],
  [3, 3]
];

const getKey = (accountId) => {
  return (matchId) => _getKey(accountId, 'player', matchId || 0);
};

const _buildKeyList = (accountId, matchId, playerData) => {
  const getMatchUpKey = (player, opponent) => {
    return getKey(accountId)(matchId) + `${player}:${opponent}`;
  };
  return matchUps.map(matchUp => {
    if (
      !playerData.player[matchUp[0]]
      || !playerData.player[matchUp[0]].username
      || !playerData.opponent[matchUp[0]]
      || !playerData.opponent[matchUp[0]].username
    ) {
      return null;
    }
    return getMatchUpKey(playerData.player[matchUp[0]].username, playerData.opponent[matchUp[0]].username);
  });
};

const fill = (data, playerData) => {
  const existingKeyList = _buildKeyList(playerData);

  return existingKeyList.map((matchUp, i) => {
    if (data[i]) {
      return data[i];
    }
    return {id: matchUp, ...playerData[i]};
  });
};

module.exports = {
  buildKeyList: (accountId, matchId, playerData) => _buildKeyList(accountId, matchId, playerData).filter(item => item !== null),
  getKey,
  fill
};