function settingsRouter(db, redis, socketWrapper) {
  function update(data) {
    db.query(`UPDATE garden_event
              SET show_programmatic_boards = ?,
                  show_match_score         = ?,
                  show_scratch_board       = ?,
                  show_webcam              = ?,
                  show_ad_unit             = ?,
                  bottom_left_text         = ?,
                  bottom_middle_text       = ?,
                  bottom_right_text        = ?
              WHERE event_id = xc?
                AND account_id = ?;`,
      [data.showProgrammaticBoards, data.showMatchScore, data.showScratchBoard, data.showWebcam, data.showAdUnit, data.bottomLeftText, data.bottomMiddleText, data.bottomRightText, data.eventId, accountId],
      (err, result) => {
        if (err) {
          console.error('Error updating:', result, err);
          socketWrapper.emit('configuration:updated', null);
          return;
        }
        load(data.eventId, true);
      });
  }

  function load(eventId, global) {
    db.query(`SELECT show_programmatic_boards AS showProgrammaticBoards,
                     show_match_score         AS showMatchScore,
                     show_scratch_board       AS showScratchBoard,
                     show_webcam              AS showWebcam,
                     show_ad_unit             AS showAdUnit,
                     bottom_left_text         AS bottomLeftText,
                     bottom_middle_text       AS bottomMiddleText,
                     bottom_right_text        AS bottomRightText
              FROM garden_event
              WHERE id = ?
                AND account_id = ?;`, [eventId, accountId], (err, result) => {
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

  socketWrapper.on('settings:update', update);
  socketWrapper.on('settings:load', load);
  return () => {
    socketWrapper.off('settings:update', update);
    socketWrapper.off('settings:load', load);
  };
}

module.exports = settingsRouter;
