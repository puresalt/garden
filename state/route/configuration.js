function configurationRoute(db, redis, socketWrapper) {
  function updateConfiguration(data) {
    db.query(`UPDATE usate_configuration
              SET show_programmatic_boards = ?,
                  show_match_score         = ?,
                  show_scratch_board       = ?,
                  show_webcam              = ?,
                  show_ad_unit             = ?,
                  bottom_left_text         = ?,
                  bottom_middle_text       = ?,
                  bottom_right_text        = ?
              WHERE id = 1;`,
      [data.showProgrammaticBoards, data.showMatchScore, data.showScratchBoard, data.showWebcam, data.showAdUnit, data.bottomLeftText, data.bottomMiddleText, data.bottomRightText],
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
                     show_match_score         AS showMatchScore,
                     show_scratch_board       AS showScratchBoard,
                     show_webcam              AS showWebcam,
                     show_ad_unit             AS showAdUnit,
                     bottom_left_text         AS bottomLeftText,
                     bottom_middle_text       AS bottomMiddleText,
                     bottom_right_text        AS bottomRightText
              FROM usate_configuration
              WHERE id = 1;`, (err, result) => {
      if (err) {
        console.warn('Error retrieving configuration:', err);
        socketWrapper.emit('configuration:loaded', {});
        return;
      }
      const returnData = result[0];
      returnData.showProgrammaticBoards = returnData.showProgrammaticBoards !== null
        ? !!returnData.showProgrammaticBoards
        : null;
      returnData.showMatchScore = returnData.showMatchScore !== null
        ? !!returnData.showMatchScore
        : null;
      returnData.showScratchBoard = returnData.showScratchBoard !== null
        ? !!returnData.showScratchBoard
        : null;
      returnData.showWebcam = returnData.showWebcam !== null
        ? !!returnData.showWebcam
        : null;
      returnData.showAdUnit = returnData.showAdUnit !== null
        ? !!returnData.showAdUnit
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
