const COLOR_WHITE = 'WHITE';
const COLOR_BLACK = 'BLACK';

const PLAYERS = {
  '': {
    name: 'Unknown',
    rating: 'N/A'
  },
  '*MAGNUS_CARLSON': {
    name: 'GM Magnus Carlsen',
    rating: 2842
  }
};
Object.freeze(PLAYERS);

module.exports = {
  COLOR_WHITE,
  COLOR_BLACK,
  PLAYERS
};
