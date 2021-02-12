const pieceMap = {
  '*p': 'p',
  '*n': 'n',
  '*b': 'b',
  '*r': 'r',
  '*q': 'q',
  '*k': 'k',
  'p': 'P',
  'n': 'N',
  'b': 'B',
  'r': 'R',
  'q': 'Q',
  'k': 'K'
};

const moveNumberRegex = /([0-9]+) \((Black|White)\)/;

const convertToSeconds = (clock) => {
  const fragments = clock.map(i => parseInt(i.trim()));
  fragments.shift();
  let seconds = fragments.pop();
  let minutes = (fragments.pop() || 0) * 60;
  let hours = (fragments.pop() || 0) * 60 * 60;
  return seconds + minutes + hours;
};

module.exports = (data) => {
  const auxiliary = []
  const rows = data.split('\n');
  for (let i = 0, count = rows.length; i < count; ++i) {
    if (rows[i].indexOf('|') === -1) {
      continue;
    }
    const row = rows[i].split('|').map(i => i.trim());
    if (row.length && row[row.length - 1]) {
      auxiliary.push(row[row.length - 1]);
    }
  }

  const lastMoveNumber = auxiliary[0].match(moveNumberRegex);
  const id = (lastMoveNumber[1] * 2) - (lastMoveNumber[2] === 'White' ? 2 : 1);
  return {
    id: id,
    pgn: id >= 1 && auxiliary[1] ? auxiliary[1].split(': \'')[1].split(' ')[0] : null,
    clock: [convertToSeconds(auxiliary[2 - (!id ? 1 : 0)].split(':')), convertToSeconds(auxiliary[3 - (!id ? 1 : 0)].split(':'))]
  };
};
