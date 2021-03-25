const ObserverUtility = require('../utility');
const parseLiveBoard = require('./parseLiveBoard');

function BughouseObserverLoop(connection, pairingId, redis, sendCommand) {

  const playerDataUtility = ObserverUtility(pairingId, redis);
  const partnerDataUtility = ObserverUtility(`${pairingId}:partner`, redis);

  let player = null;
  let partner = null;
  let observing = null;
  let currentCommand = null;
  let noGameFound = false;

  playerDataUtility.loopForUsernameChanges((usernames) => {
    console.log('huh?');
    observing = usernames;
    [player, partner] = usernames.split(',');
    noGameFound = false;
    sendCommand('follow', player);
  });

  let playerGameId = null;
  let partnerGameId = null;

  const liveGameRegex = /<12> [a-zA-Z-]+ [a-zA-Z-]+ [a-zA-Z-]+ [a-zA-Z-]+ [a-zA-Z-]+ [a-zA-Z-]+ [a-zA-Z-]+ [a-zA-Z-]+ [W|B] [0-9-]+ [01] [01] [01] [01] [01] ([0-9]+)/;

  const gameOverRegex = /{Game ([0-9]+).*} ([2/01-]+)/;
  const getGameOverData = data => data.match(gameOverRegex);

  const gameIdDataRegex = /You are now observing game ([0-9]+)\./;
  const getGameIdData = data => data.match(gameIdDataRegex);

  const followRegex = /You will now be following/;

  const bughousePiecePassedRegex = /<b1> game ([0-9]+) white \[([PNBQR]+)]black \[([PNBQR]+)]/;
  const parsePieces = pieces => pieces.split('').sort();
  const parseBagOfHolding = (data) => {
    const match = data.match(bughousePiecePassedRegex);
    if (!match) {
      return null;
    }
    return {
      gameId: match[1],
      pieces: [
        parsePieces(match[2]),
        parsePieces(match[3])
      ]
    }
  };

  const lastPosition = {
    player: null,
    partner: null
  };

  function gameObserver(data) {
    const gameIdData = getGameIdData(data);
    if (gameIdData) {
      if (playerGameId === null) {
        playerGameId = gameIdData[1];
        sendCommand('observe', partner);
      } else if (partnerGameId === null) {
        partnerGameId = gameIdData[1];
      }
    }
    if (data.indexOf('There is no such game.') === -1) {
      const gameOverData = getGameOverData(data);
      if (gameOverData && gameOverData[1] === playerGameId) {
        sendCommand('unobserve', playerGameId);
        sendCommand('unobserve', partnerGameId);
        playerGameId = null;
        partnerGameId = null;
      } else {
        currentCommand = null;
        playerGameId = null;
        partnerGameId = null;
        const liveGameId = (data.match(liveGameRegex) || [])[1];
        console.log('liveGameId:', liveGameId, playerGameId, partnerGameId);
        if (!liveGameId) {
          return;
        }
        const boardData = parseLiveBoard(data);
        const whichPlayer = liveGameId === playerGameId
          ? 'player'
          : (liveGameId === partnerGameId
            ? 'partner'
            : false);
        console.log('WHICH PLAYER:', whichPlayer);
        if (whichPlayer) {
          const boardDataId = boardData.id || 0;
          if (boardDataId) {
            lastPosition[whichPlayer] = boardData;
            const bagOfHolding = parseBagOfHolding(data);
            if (bagOfHolding) {
              lastPosition[whichPlayer].bagOfHolding = bagOfHolding.pieces;
            } else {
              lastPosition[whichPlayer].bagOfHolding = [[], []];
            }
            (whichPlayer === 'player' ? playerDataUtility : partnerDataUtility).pushPosition({
              ...(lastPosition[whichPlayer]),
              pauseClocks: false
            });
          }
        } else {
          const bagOfHolding = parseBagOfHolding(data);
          if (bagOfHolding) {
            const whichPlayer = bagOfHolding.gameId === playerGameId
              ? 'player'
              : (bagOfHolding.gameId === partnerGameId
                ? 'partner'
                : false);
            lastPosition[whichPlayer].bagOfHolding = bagOfHolding;
            (whichPlayer === 'player' ? playerDataUtility : partnerDataUtility).pushPosition({
              ...(lastPosition[whichPlayer]),
              pauseClocks: false
            });
          }
        }
      }
      return;
    }

    currentCommand = null;
    noGameFound = true;
  }

  connection.on('data', (data) => {
    data = data.toString();
    if (observing === null || noGameFound) {
      return console.info('Nothing to observe');
    }
    console.log(data);
    if (followRegex.test(data)) {
      return;
    }
    gameObserver(data);
  });
}

/**
 * Observe live bughouse matches.
 *
 * @param {Number|String} pairingId
 * @param {redis} redis
 * @param {{username: String, password: String}} config
 */
module.exports = BughouseObserverLoop;
