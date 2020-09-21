import React from 'react';
import OrDefault from 'gscc-common/react/OrDefault';
import Chessboard from 'gscc-common/react/Chessboard';
import './Board.css';

class Board extends React.Component {
  render() {
    const {board, name, rating, pairings, large, socket} = this.props;
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
    const chessBoard = <Chessboard
      boardName={'board-' + board}
      height={size}
      width={size}
      viewOnly={true}
      coordinates={false}
      socket={socket}
    />;
    return (
      <div className={"Board" + (large ? ' Large' : (done ? ' Faded' : ''))} key={board} id={'board-' + board}>
        <header><span>BOARD {board}:</span> <OrDefault value={name}/> <em>{rating}</em></header>
        <div className="board">
          {chessBoard}
        </div>
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
}

export default Board;
