module.exports = (accountId, namespace, matchId) => {
  return `gcss:${namespace}:${accountId}` + (matchId !== null ? `:${matchId}` : '');
};
