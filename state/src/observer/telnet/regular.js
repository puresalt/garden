const ObserverUtility = require('../utility');
const parseLiveBoard = require('./parseLiveBoard');
const {buildPosition} = require('../../utility');

function RegularObserverLoop(connection, pairingId, redis, sendCommand, endOfCommand, pgnCommandName) {
  const {
    pushPosition,
    clearGameHistory,
    loopForUsernameChanges,
  } = ObserverUtility(pairingId, redis);

  let white = null;
  let black = null;
  let observing = null;
  let currentCommand = null;
  let noGameFound = false;

  loopForUsernameChanges((usernames) => {
    observing = usernames;
    [white, black] = usernames.split(',');
    noGameFound = false;
    findGames();
  });

  let hopefullyGameId = null;
  let runningMoves = null;

  function observeGame(gameId) {
    currentCommand = 'observeGame';
    hopefullyGameId = gameId;
    runningMoves = null;
    sendCommand('observe', gameId);
  }

  const liveGameRegex = /^<12>/;
  const pgnRegexMatch = /[\s\S]+\[Site [\s\S]+/;
  const pgnMovesRegex = /1. ([NBQRKOxa-h0-9=/+#\s\S .-]+)$/;
  const individualMoveRegex = /([NBQRKOxa-h0-9=/+#-]+)\s/g;

  const gameOverRegex = /^{.*} ([2/01-]+)/;
  const isGameOver = data => data.match(gameOverRegex);
  const isPgn = data => pgnRegexMatch.test(data);

  function gameObserver(data) {
    if (data.indexOf('There is no such game.') === -1) {
      if (isGameOver(data)) {
        currentCommand = null;
        if (runningMoves[runningMoves.length - 1]) {

        }
        pushPosition({...runningMoves[runningMoves.length - 1], pauseClocks: true});
        console.log('Finished storing live game:', observing);
      } else if (isPgn(data)) {
        const pgnMoves = (data.match(pgnMovesRegex) || [''])[0];
        const currentPosition = buildPosition([...pgnMoves.matchAll(individualMoveRegex)].map(i => [i[1], '0 : 00']));
        const moveList = (currentPosition || {}).moveList || [];
        for (let i = 0, count = moveList.length; i < count; ++i) {
          if (runningMoves[i]) {
            break;
          }
          runningMoves[i] = moveList[i];
        }
        const lastPosition = !currentPosition || (runningMoves[runningMoves.length - 1] && runningMoves[runningMoves.length - 1].id > currentPosition)
          ? runningMoves[runningMoves.length - 1]
          : currentPosition;
        if (lastPosition) {
          pushPosition({...lastPosition, moveList: runningMoves});
        }
      } else {
        const liveGameId = (data.match(liveGameRegex) || [])[1];
        if (liveGameId === hopefullyGameId) {
          const boardData = parseLiveBoard(data);
          const boardDataId = boardData.id || 0;
          if (runningMoves === null) {
            runningMoves = new Array(0).fill(null);
            if (boardDataId) {
              runningMoves[boardData.id - 1] = boardData.pgn;
            }
            sendCommand(pgnCommandName, hopefullyGameId);
          } else if (boardDataId) {
            runningMoves.push(boardData.pgn);
            pushPosition({...boardData, moveList: runningMoves});
          }
        }
      }
      return;
    }

    currentCommand = null;
    noGameFound = true;
  }

  let searchingHistoryFor = null;
  let emptyGameHistoryRegex = null;

  function findHistory(historyFor) {
    currentCommand = 'findHistory';
    searchingHistoryFor = historyFor;
    emptyGameHistoryRegex = new RegExp(`${searchingHistoryFor} has no games record.`, 'i');
    process.nextTick(() => sendCommand('history', historyFor));
  }

  const individualGameHistoryRegex = /([0-9]+): [-+=] [0-9]+ [B|W] [0-9]+ ([a-zA-Z0-9_-]+)\s+\[/g;

  function findHistoryObserver(data) {
    currentCommand = null;
    if (!emptyGameHistoryRegex.test(data)) {
      const historyList = [...(data.matchAll(individualGameHistoryRegex) || [])];
      const against = searchingHistoryFor === white
        ? black
        : white;
      if (historyList.length) {
        const probableGame = historyList.map((row, i) => {
          return against.indexOf(row[2].toLowerCase()) > -1
            ? row[1]
            : null;
        }).filter(i => i !== null)[0];
        if (probableGame) {
          return getSmoves(searchingHistoryFor, probableGame);
        }
      }
    }

    noGameFound = true;
  }

  let gameListRegex = null;
  let foundGame = null;

  function findGames() {
    currentCommand = 'findGames';
    foundGame = null;
    gameListRegex = new RegExp(`([0-9]+)[ ]+[0-9]+[ ]+${white}[a-zA-Z0-9() ]+${black}[a-zA-Z0-9() ]+[a-zA-Z]+[ ]+[0-9]+[ ]+[0-9]+[ ]+[W|B]:[ ]+[0-9]+`, 'i');
    clearGameHistory(() => sendCommand(`games`));
  }

  function findGameObserver(data) {
    if (foundGame === null) {
      foundGame = data.match(gameListRegex);
    }
    if (data.indexOf(endOfCommand) > -1) {
      currentCommand = null;
      if (foundGame !== null) {
        return observeGame(foundGame[1]);
      } else {
        findHistory(white);
      }
    }
  }

  const smovesListRegex = /\s+([NBQRKOxa-h0-9=/+#-]+)\s+\(([0-9:]+)\)/g;
  const abjournedGamesRegex = /([a-zA-Z0-9_-]+) has no adjourned games./i;
  const noGameFoundRegex = /([a-zA-Z0-9_-]+) has no game numbered [0-9]+/i;

  let moveListData = null;
  let smovesPlayer = null;
  let smovesIndex = null;
  let smovesWaiting = 0;

  function getSmoves(player, index, incomingSmovesWaiting) {
    currentCommand = 'smoves';
    moveListData = '';
    smovesPlayer = player;
    smovesIndex = index;
    smovesWaiting = incomingSmovesWaiting || 0;
    process.nextTick(() => sendCommand('smoves', player, index));
  }

  function smovesObserver(data) {
    if (data.indexOf('You may use "smoves" if you specify an argument.') > -1 || abjournedGamesRegex.test(data) || noGameFoundRegex.test(data)) {
      noGameFound = true;
      currentCommand = null;
      return;
    }

    moveListData += data;
    if (data.indexOf(endOfCommand) > -1) {
      if (data.indexOf('Game database temporarily unavailable.') > -1) {
        if (smovesWaiting > 15) {
          console.warn('Giving up on:', smovesPlayer, smovesIndex);
          noGameFound = true;
          currentCommand = null;
          smovesPlayer = null;
          smovesIndex = null;
          smovesWaiting = 0;
          return
        }
        return setTimeout(() => {
          getSmoves(smovesPlayer, smovesIndex, smovesWaiting + 1);
        }, 500);
      }
      const foundMoves = moveListData.matchAll(smovesListRegex);
      if (!foundMoves) {
        noGameFound = true;
      }
      const finalPosition = buildPosition([...foundMoves].map(i => [i[1], i[2]]));
      if (finalPosition) {
        pushPosition({...finalPosition, pauseClocks: true}, (err) => {
          noGameFound = false;
          currentCommand = null;
          smovesPlayer = null;
          smovesIndex = null;
          smovesWaiting = 0;
          console.log('Finished storing game:', observing);
        });
      }
    }
  }

  const observerList = {
    findGames: findGameObserver,
    findHistory: findHistoryObserver,
    smoves: smovesObserver,
    observeGame: gameObserver
  };
  connection.on('data', (data) => {
    console.log(data.toString());
    if (observing === null || noGameFound) {
      return console.info('Nothing to observe');
    }
    if (observerList[currentCommand]) {
      observerList[currentCommand](data.toString());
    }
  });
}

/**
 * Observe regular games regardless of time control.
 *
 * @param {Number|String} pairingId
 * @param {redis} redis
 * @param {{username: String, password: String}} config
 */
module.exports = RegularObserverLoop;
