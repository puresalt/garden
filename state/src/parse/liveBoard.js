const COLORS = {
  w: 'home',
  b: 'away'
}
Object.freeze(COLORS);

const buildFenBoard = (board, flipped) => {
  const fen = board.map((row) => {
    return row.split('').reduce((gathered, item) => {
      if (item !== '-') {
        gathered.push(item);
      } else if (typeof gathered[gathered.length - 1] === 'number') {
        ++gathered[gathered.length - 1];
      } else {
        gathered.push(1);
      }
      return gathered;
    }, []);
  }).map(item => item.join(''));

  return flipped
    ? fen.reverse().join('/')
    : fen.join('/');
};

const buildFenCastling = (castlingPositions) => {
  const castling = [];
  if (castlingPositions[0] === '1') {
    castling.push('K');
  }
  if (castlingPositions[1] === '1') {
    castling.push('Q');
  }
  if (castlingPositions[2] === '1') {
    castling.push('k');
  }
  if (castlingPositions[3] === '1') {
    castling.push('q');
  }

  return castling.length
    ? castling.join('')
    : '-';
};

const enPassantLookupRow = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const buildFenEnPassant = (lastPawnMoveWasDoubled, color) => {
  return lastPawnMoveWasDoubled > -1
    ? [enPassantLookupRow[lastPawnMoveWasDoubled], color === 'w' ? 3 : 6].join('')
    : '-';
};

const extractCoordinates = (movement) => {
  switch (movement) {
    case 'none':
      return [null, null];
    case 'o-o':
      return ['e8', 'g8'];
    case 'o-o-o':
      return ['e8', 'c8'];
    case 'O-O':
      return ['e1', 'g1'];
    case 'O-O-O':
      return ['e1', 'c1'];
    default:
      const fragments = movement.split('/');
      if (!fragments[1]) {
        return [null, null];
      }
      const coordinates = fragments[1].split('-');
      if (!coordinates[1]) {
        return [null, null];
      }
      return [coordinates[0], coordinates[1], fragments[0]];
  }
};

module.exports = (data) => {
  const columns = data.split(' ');

  const home = (columns[17] || '');
  const away = (columns[18] || '');
  const flippedBoard = columns[30] === '1';
  const color = columns[9].toLowerCase();
  const fiftyMoveCount = parseInt(columns[15]);
  const clock = columns.slice(24, 26).map((item) => {
    const timeRemaining = parseInt(item);
    return timeRemaining > 0
      ? timeRemaining
      : 0;
  });
  const moveNumber = parseInt(columns[26]);
  const pgn = columns[29];

  const [from, to, piece] = extractCoordinates(columns[27]);
  const fen = [
    buildFenBoard(columns.slice(1, 9), flippedBoard),
    color,
    buildFenCastling(columns.slice(11, 15)),
    buildFenEnPassant(parseInt(columns[10]), color),
    fiftyMoveCount,
    moveNumber
  ].join(' ');

  return {
    id: (moveNumber * 2) - (color === 'w' ? 2 : 1),
    pgn,
    piece,
    from,
    to,
    clock,
    fen,
    home,
    away,
    moving: COLORS[color]
  };
};
