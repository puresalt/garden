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

const moveNumberRegex = /Move # : ([0-9]+) \((Black|White)\)/;
const pgnRegex = /[Black|White] Moves : '([NBQRKOxa-h0-9=/+#-]+)[0-9\s\S(:)]+'/;
const clockRegex = /(Black|White) Clock : ([0-9 :]+)/g;

const convertToSeconds = (raw) => {
  const clock = raw.split(':').map(i => i.trim());
  const fragments = clock.map(i => parseInt(i.trim()));
  let seconds = fragments.pop();
  let minutes = (fragments.pop() || 0) * 60;
  let hours = (fragments.pop() || 0) * 60 * 60;
  return seconds + minutes + hours;
};

module.exports = (data) => {
  const fen = [];
  const rows = data.split('\n');
  for (let i = 0, count = rows.length; i < count; ++i) {
    if (rows[i].indexOf('|') === -1) {
      continue;
    }
    const row = rows[i].split('|').map(i => i.trim());
    const board = row.slice(1, 9);
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

	console.log(data);
  const [_, moveNumber, color] = (data.match(moveNumberRegex) || [null, 1, 'White']);
  return {
    id: (moveNumber * 2) - (color === 'White' ? 2 : 1),
    pgn: (data.match(pgnRegex) || [])[1],
    clock: [...(data.matchAll(clockRegex) || [])].reduce((gathered, clock) => {
      gathered[clock[1] === 'White' ? 0 : 1] = convertToSeconds(clock[2]);
      return gathered;
    }, [3600, 3600]),
    fen: fen.join('/'),
    moving: color === 'White' ? 'home' : 'away'
  };
};
