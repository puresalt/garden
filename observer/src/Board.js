import React from 'react';
import Chessboard from 'garden-common/react/Chessboard';
import Button from 'react-bootstrap/Button';

function Board(props) {
  const {pairing, boardId, orientation, observingGame, handleObserveGame, examiningGame, handleExamineGame, socket} = props;

  return (
    <div className={`Board orientation-${orientation}`} key={boardId} id={'board-' + (pairing || 'examine')}>
      <Chessboard
        key={'board:' + boardId}
        boardName={'board:' + boardId}
        size={200}
        orientation={orientation}
        selectable={{enabled: false}}
        viewOnly={true}
        coordinates={false}
        socket={socket}
      />
      <Button
        className={'observe-board-button'}
        variant={observingGame ? 'danger' : 'warning'}
        size={'sm'}
        onClick={() => handleObserveGame(boardId)}
      ><i aria-label={'Observe'} className={'fa fa-eye'}/></Button>
      <Button
        className={'examine-board-button'}
        variant={examiningGame ? 'success' : 'primary'}
        size={'sm'}
        onClick={() => handleExamineGame(boardId)}
      ><i aria-label={'Examine'} className={'fa fa-clipboard-list'}/></Button>
    </div>
  );
}

export default Board;
