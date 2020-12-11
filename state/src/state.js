function updatePlayerList(db, redis, teamId, matchId, callback) {
  db.query(`SELECT garden_member.lichess_handle
            FROM garden_member
                 INNER JOIN garden_player
                            ON (garden_player.member_id = garden_member.id AND
                                garden_player.match_id = ?);`, matchId, (err, memberList) => {
    if (err) {
      return callback(err);
    }
    db.query('SELECT lichess_handle FROM garden_opponent WHERE match_id = ?;', matchId, (err, opponentList) => {
      if (err) {
        return callback(err);
      }
      const usernameList = Array.from(
        new Set([...memberList, ...opponentList]
          .map(item => item.lichess_handle)
          .filter(item => item))
      );
      if (!usernameList.length) {
        return redis.del(`stream:${teamId}:${matchId}:username`, callback);
      }
      redis
        .multi()
        .del(`stream:${teamId}:${matchId}:username`)
        .rpush(`stream:${teamId}:${matchId}:username`, ...usernameList)
        .exec(callback);
    });
  });
}

module.exports = {
  updatePlayerList
};