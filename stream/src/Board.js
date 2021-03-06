import React, {useEffect} from 'react';
import OrDefault from 'garden-common/react/OrDefault';
import Chessboard from 'garden-common/react/Chessboard';
import './Board.css';
import DebugInfo from './DebugInfo';

function Board(props) {
  const {board, showProgrammaticBoards, debugMode, name, rating, pairings, large, socket, boardDimensions, boardInfoDimensions} = props;
  const round = pairings.filter(item => item.result !== null).length + 1;
  const done = round > pairings.length;
  const tally = round > 1
    ? pairings
      .filter(item => item.result !== null)
      .reduce((gathered, item) => gathered + item.result, 0)
    : null;
  const size = large
    ? 936
    : 464;

  useEffect(() => {
    if (!showProgrammaticBoards) {
      return;
    }
    const requestGameState = (gameId) => {
      socket.emit(`viewer:board:${board}:start`, gameId);
    };
    const stopGameState = (gameId) => {
      socket.emit(`viewer:board:${board}:stop`, gameId);
    };
    socket.emit(`viewer:board:${board}:ready`);
    socket.on(`viewer:board:${board}:started`, requestGameState);
    socket.on(`viewer:board:${board}:stopped`, stopGameState);
    return () => {
      socket.off(`viewer:board:${board}:started`, requestGameState);
      socket.off(`viewer:board:${board}:stopped`, stopGameState);
    };
  }, [showProgrammaticBoards]);

  return (
    <div className={'Board' + (large ? ' Large' : (done ? ' Faded' : '')) + (debugMode ? ' debug' : '')} key={board}
         id={'board-' + board}>
      <header><span>BOARD {board}:</span> <OrDefault value={name}/> <em>{rating}</em></header>
      {showProgrammaticBoards
        ? <Chessboard
          boardName={'board:' + board}
          size={size}
          viewOnly={true}
          coordinates={false}
          orientation={pairings[round - 1].orientation}
          socket={socket}
        />
        : <>
          <div className="board-placeholder">
            <DebugInfo left={boardDimensions.left} top={boardDimensions.top} height={size} width={size}/>
          </div>
          <div className="board-placeholder-info">
            <DebugInfo left={boardInfoDimensions.left} top={boardInfoDimensions.top} height={boardInfoDimensions.height}
                       width={boardInfoDimensions.width}/>
          </div>
        </>
      }
      <div className="pairings">
        <table>
          <tbody>
          {pairings.map((item, i) => {
            const boardNumber = i + 1;
            const {name, rating, result} = item;
            const resultClassName = result === 1
              ? 'win'
              : (result === 0.5
                ? 'draw'
                : (result === 0
                  ? 'loss'
                  : ''));
            return <tr key={boardNumber} className={round === boardNumber ? 'active' : ''}>
              <td>{boardNumber}.</td>
              <td>{name}</td>
              <td>{rating}</td>
              <td className={resultClassName}><OrDefault value={result}/></td>
            </tr>;
          })}
          </tbody>
          <tfoot>
          <tr>
            <td colSpan="4"/>
          </tr>
          <tr>
            <td colSpan="3">{done ? 'FINAL' : 'TOTAL'}</td>
            <td><OrDefault value={tally}/></td>
          </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default Board;
