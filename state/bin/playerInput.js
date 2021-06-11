const TABLE_NAME = 'nosc_player';
const SECTIONS = ['K-12', 'K-9', 'K-6', 'K-5', 'K-3', 'K-1'];

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
const readFile = (file) => {
  try {
    return fs.readFileSync(path.join(dataDir, file), 'utf-8');
  } catch (e) {
    console.warn(e);
    return '';
  }
};

const DATA = SECTIONS.reduce((gathered, section) => {
  gathered[section] = {
    players: readFile(`${section}/players`),
    ratings: readFile(`${section}/ratings`)
  };
  return gathered;
}, {});
const exists = i => i;

let globalId = 0;
const mapLookupFunction = (row) => {
  const data = row.split(' ');
  return [++globalId, data.slice(3).join(' ')].join(' ');
};
const convertPlayerDataToLookupTable = (section) => {
  const playerData = DATA[section].players;
  if (!playerData) {
    return '';
  }
  const convertedPlayerData = playerData.split('\n').map(mapLookupFunction).filter(exists).join('\n');
  return `'${section}': \`${convertedPlayerData}\``;
};

fs.writeFileSync(path.join(dataDir, 'lookup.js'), [
  `module.exports = {\n`,
  SECTIONS.map(convertPlayerDataToLookupTable).filter(exists).join(',\n'),
  `};`
].join(''));

globalId = 0;
const ratingRegex = /[0-9]+ [A-Z, ]+\(([0-9 ]+)\)/;
const convertPlayerDataToSql = (section) => {
  const playerData = DATA[section].players;
  if (!playerData) {
    return;
  }

  const ratings = DATA[section].ratings;
  const ratingsLookup = ratings.split('\n').reduce((gathered, row) => {
    const data = row.match(ratingRegex);
    gathered.push((data && data[1] && parseInt(data[1].replace(' ', ''))) || null);
    return gathered;
  }, []);

  const convertedPlayerData = playerData.split('\n').reduce((gathered, row, index) => {
    const data = row.split(' ');
    const name = data.slice(3).join(' ');

    gathered.push([++globalId, data[2], name, `'${data[1]}'`, ratingsLookup[index] || 'NULL', `'${section}'`].join(', '));
    return gathered;
  }, []);

  return `INSERT INTO \`nosc_player\`\nVALUES (${convertedPlayerData.join('),\n       (')});`;
};

fs.writeFileSync(path.join(__dirname, '../schema/players.sql'), [
  `DROP TABLE IF EXISTS \`${TABLE_NAME}\`;
CREATE TABLE \`${TABLE_NAME}\`
(
    id      INT AUTO_INCREMENT PRIMARY KEY,
    uscf_id INT UNSIGNED                                     NOT NULL,
    name    VARCHAR(255)                                     NOT NULL,
    handle  VARCHAR(255)                                     NOT NULL,
    rating  INT UNSIGNED                                     NULL,
    section ENUM ('K-1', 'K-3', 'K-5', 'K-6', 'K-9', 'K-12') NOT NULL,
    UNIQUE INDEX (uscf_id),
    INDEX (section)
);`,
  SECTIONS.map(convertPlayerDataToSql).filter(exists).join('\n')
].join('\n'));
