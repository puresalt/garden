const pieceMap = {
  '*P': 'p',
  '*N': 'n',
  '*B': 'b',
  '*R': 'r',
  '*Q': 'q',
  '*K': 'k',
  'P': 'P',
  'N': 'N',
  'B': 'B',
  'R': 'R',
  'Q': 'Q',
  'K': 'K'
};

const convertToSeconds = (clock) => {
  const fragments = clock.map(i => parseInt(i.trim()));
  let seconds = fragments.pop();
  let minutes = (fragments.pop() || 0) * 60;
  let hours = (fragments.pop() || 0) * 60 * 60;
  return seconds + minutes + hours;
};

module.exports = (data) => {
  const fen = [];
  const auxiliary = [];
  const rows = data.split('\n');
  for (let i = 0, count = rows.length; i < count; ++i) {
    if (rows[i].indexOf('|') === -1 || i % 2 === 1) {
      continue;
    }
    const row = rows[i].split('|').map(i => i.trim());
    const board = row.slice(1, 9);
    auxiliary.push(row[row.length - 1]);

    if (board.length === 8) {
      fen.push(board.reduce((gathered, item) => {
        if (item) {
          gathered.push(pieceMap[item]);
        } else if (typeof gathered[gathered.length - 1] === 'number') {
          ++gathered[gathered.length - 1];
        } else {
          gathered.push(1);
        }
        return gathered;
      }, []).join(''));
    }
  }

  const lastMoveNumber = auxiliary[0].match(/([0-9]+) \((Black|White)\)/);
  return {
    id: (lastMoveNumber[1] * 2) - (lastMoveNumber[2] === 'White' ? 1 : 0),
    move: auxiliary[1].split(': \'')[1].split(' ')[0],
    clock: [3600, 3600, convertToSeconds(auxiliary[3].split(':')), convertToSeconds(auxiliary[4].split(':'))],
    fen: fen.join('/')
  };
};
