function configurationRoute(db, redis, socketWrapper) {
  function updateConfiguration(data) {
    const nextRoundStart = data.nextRoundStart
	  ? data.nextRoundStart.replace('T', ' ').split('.')[0]
          : null;
    db.query(`UPDATE college_configuration
              SET show_programmatic_boards = ?,
                  show_scratch_board       = ?,
                  show_ad_unit             = ?,
                  show_sponsor_unit        = ?,
                  bottom_left_text         = ?,
                  bottom_middle_text       = ?,
                  bottom_right_text        = ?,
                  next_round_start         = ?
              WHERE id = 1;`,
      [data.showProgrammaticBoards, data.showScratchBoard, data.showAdUnit, data.showSponsorUnit, data.bottomLeftText, data.bottomMiddleText, data.bottomRightText, nextRoundStart],
      (err, result) => {
        if (err) {
          console.error('Error updating:', result, err);
          socketWrapper.emit('configuration:updated', null);
          return;
        }
        loadConfiguration(true);
      });
  }

  function loadConfiguration(global) {
    db.query(`SELECT show_programmatic_boards AS showProgrammaticBoards,
                     show_scratch_board       AS showScratchBoard,
                     show_ad_unit             AS showAdUnit,
                     show_sponsor_unit        AS showSponsorUnit,
                     bottom_left_text         AS bottomLeftText,
                     bottom_middle_text       AS bottomMiddleText,
                     bottom_right_text        AS bottomRightText,
                     next_round_start         AS nextRoundStart
              FROM college_configuration
              WHERE id = 1;`, (err, result) => {
      if (err) {
        console.warn('Error retrieving configuration:', err);
        socketWrapper.emit('configuration:loaded', {});
        return;
      }
		      console.log(result[0]);
      const returnData = result[0];
      returnData.showProgrammaticBoards = returnData.showProgrammaticBoards !== null
        ? !!returnData.showProgrammaticBoards
        : null;
      returnData.showScratchBoard = returnData.showScratchBoard !== null
        ? !!returnData.showScratchBoard
        : null;
      returnData.showAdUnit = returnData.showAdUnit !== null
        ? !!returnData.showAdUnit
        : null;
      returnData.showSponsorUnit = returnData.showSponsorUnit !== null
        ? !!returnData.showSponsorUnit
        : null;
      returnData.nextRoundStart = returnData.nextRoundStart !== null
        ? returnData.nextRoundStart.toUTCString()
        : null;
      socketWrapper[global ? 'broadcastAll' : 'emit']('configuration:loaded', result[0]);
    });
  }

  socketWrapper.on('configuration:update', updateConfiguration);
  socketWrapper.on('configuration:load', loadConfiguration);
  return () => {
    socketWrapper.off('configuration:update', updateConfiguration);
    socketWrapper.off('configuration:load', loadConfiguration);
  };
}

module.exports = configurationRoute;
