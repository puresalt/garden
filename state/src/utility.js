const ChessBoard = require('chess.js').Chess;

/**
 * Convert chess clock like data to number of seconds.
 *
 * @param {String} raw
 * @returns {Number}
 */
const convertToSeconds = (raw) => {
  const clock = raw.split(':').map(i => i.trim());
  const fragments = clock.map(i => parseInt(i.trim()));
  let seconds = fragments.pop();
  let minutes = (fragments.pop() || 0) * 60;
  let hours = (fragments.pop() || 0) * 60 * 60;
  return seconds + minutes + hours;
};

/**
 * Build a final position out of a move list.
 *
 * @param {Array<[String, Number]>} moveList
 * @returns {{move: [String, String], pgn, id: number, clock: Array<[Number, Number]>, moveList: String[], moving: String, fen: String}|null}
 */
const buildPosition = (moveList) => {
  const chessBoard = new ChessBoard();
  let move;
  let lastValidMove;
  const clock = [3600, 3600];
  const moves = [];
  for (let i = 0, count = moveList.length; i < count; ++i) {
    move = chessBoard.move(moveList[i][0]);
    if (!move) {
      break
    }
    moves.push(move.san);
    const time = convertToSeconds(moveList[i][1]);
    clock[i % 2 === 1 ? 0 : 1] += 10 - time;
    lastValidMove = move;
  }
  return lastValidMove ? {
    id: chessBoard.history().length,
    pgn: lastValidMove.san,
    fen: chessBoard.fen(),
    move: [lastValidMove.from, lastValidMove.to],
    clock: clock,
    moveList: moves,
    moving: lastValidMove.color
  } : null;
};

module.exports = {
  buildPosition,
  convertToSeconds
};