const CONFIGURATION_TABLE_NAME = 'nosc_configuration';
const PAIRING_TABLE_NAME = 'nosc_pairing';
const SECTIONS = ['K-12', 'K-9', 'K-6', 'K-5', 'K-3', 'K-1'];

const ROUND = process.env.ROUND || 1;
const MAX_ROUNDS = process.env.MAX_ROUNDS || 8;

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
const readFile = (section) => {
  try {
    return fs.readFileSync(path.join(dataDir, section, `round-${ROUND}`), 'utf-8');
  } catch (e) {
    return '';
  }
};
const playerLookup = require('../data/lookup');

let observerBoardId = 0;
const DATA = SECTIONS.reduce((gathered, section) => {
  gathered[section] = {
    pairings: readFile(section),
    observerBoardId: ++observerBoardId
  };
  return gathered;
}, {});

let globalId = 0;
const usedIds = [];
const convertPairingDataToSql = (section) => {
  if (!DATA[section].pairings) {
    return '';
  }

  const players = playerLookup[section].split('\n');
  const pairings = DATA[section].pairings.split('\n');
  const sql = [];
  const c = players.length;
  let boardId = 0;
  for (let i = 0, count = pairings.length; i < count; ++i) {
    const row = [...(pairings[i].matchAll(/([.?#^&A-Z, ]+)  /g))];
    if (!row) {
      continue;
    }
    let homeId;
    let awayId;
    for (let p = 0; p < c; ++p) {
      const playerId = players[p].split(' ')[0];
      if (usedIds.indexOf(playerId) > -1) {
        continue;
      }
      if (players[p].indexOf(row[0][1].trim().replace(/[.?#^&]/, '')) > -1) {
        homeId = playerId;
      } else if (players[p].indexOf(row[1][1].trim().replace(/[.?#^&]/, '')) > -1) {
        awayId = playerId;
      }
    }
    if (homeId && awayId) {
      usedIds.push(homeId, awayId);
      sql.push(`(${++globalId}, ${++boardId}, ${homeId}, ${awayId}, '${section}', ${boardId === 1 ? DATA[section].observerBoardId : 'NULL'})`);
    }
  }

  return `INSERT INTO \`${PAIRING_TABLE_NAME}\`\nVALUES ${sql.join(',\n       ')};`;
};

fs.writeFileSync(path.join(__dirname, `../schema/round-${ROUND}.sql`), [
  `UPDATE \`${CONFIGURATION_TABLE_NAME}\`
SET bottom_middle_text = '<span>Round:</span> ${ROUND} of ${MAX_ROUNDS}'
WHERE id = 1;

DROP TABLE IF EXISTS \`${PAIRING_TABLE_NAME}\`;
CREATE TABLE \`${PAIRING_TABLE_NAME}\`
(
    id                INT AUTO_INCREMENT PRIMARY KEY,
    board_id          INT UNSIGNED                                     NULL,
    home_id           INT UNSIGNED                                     NULL,
    away_id           INT UNSIGNED                                     NULL,
    section           ENUM ('K-1', 'K-3', 'K-5', 'K-6', 'K-9', 'K-12') NOT NULL,
    observer_board_id INT UNSIGNED                                     NULL,
    UNIQUE INDEX (home_id),
    UNIQUE INDEX (away_id)
);`,
  SECTIONS.map(convertPairingDataToSql).join('\n')
].join('\n'));
