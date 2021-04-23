import React from 'react'
import { duration } from 'moment';
import PropTypes from 'prop-types'
import { Chessground as NativeChessground } from 'chessground'
import Chess from 'chess.js'
import './Chessboard/css/chessground.css';
import './Chessboard.css';

const padded = num => String(num).padStart(2, '0');
const parseClock = (hours, minutes, seconds) => {
  if (hours) {
    return `${hours}:${padded(minutes)}:${padded(seconds)}`;
  } else if (minutes) {
    return `${padded(minutes)}:${padded(seconds)}`;
  } else {
    return String(seconds);
  }
};

const getOrientation = orientation => orientation === 'away' || orientation === 'black'
  ? 'black'
  : 'white';

const availableMoves = (chess) => {
  const moves = chess.moves({verbose: true}).reduce((gathered, item) => {
    if (!gathered[item.from]) {
      gathered[item.from] = [];
    }
    gathered[item.from].push(item.to);
    return gathered;
  }, {});
  return Object.keys(moves).reduce((gathered, key) => {
    gathered.set(key, moves[key]);
    return gathered;
  }, new Map());
}

const propTypes = {
  boardName: PropTypes.string,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  fen: PropTypes.string,
  orientation: PropTypes.string,
  turnColor: PropTypes.string,
  check: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  lastMove: PropTypes.array,
  selected: PropTypes.string,
  coordinates: PropTypes.bool,
  autoCastle: PropTypes.bool,
  viewOnly: PropTypes.bool,
  captureKeyEvents: PropTypes.bool,
  disableContextMenu: PropTypes.bool,
  resizable: PropTypes.bool,
  addPieceZIndex: PropTypes.bool,
  highlight: PropTypes.object,
  animation: PropTypes.object,
  movable: PropTypes.object,
  premovable: PropTypes.object,
  predroppable: PropTypes.object,
  draggable: PropTypes.object,
  selectable: PropTypes.object,
  onChange: PropTypes.func,
  onMove: PropTypes.func,
  onMoveFen: PropTypes.func,
  onDropNewPiece: PropTypes.func,
  onSelect: PropTypes.func,
  onPromotion: PropTypes.func,
  onLoading: PropTypes.func,
  items: PropTypes.object,
  drawable: PropTypes.object,
  socket: PropTypes.object
};

export default class Chessground extends React.PureComponent {
  constructor(props) {
    super(props);
    const homeClock = duration().add(this.props.timeLimt || 1500, 's');
    const awayClock = duration().add(this.props.timeLimt || 1500, 's');
    this.state = {
      requestingPromotion: false,
      moveList: [],
      homeClock: homeClock,
      homeHours: homeClock.hours(),
      homeMinutes: homeClock.minutes(),
      homeSeconds: homeClock.seconds(),
      awayClock: awayClock,
      awayHours: awayClock.hours(),
      awayMinutes: awayClock.minutes(),
      awaySeconds: awayClock.seconds(),
      moving: 'home',
      pauseClocks: true,
      pausePosition: true,
      currentMove: 0,
      viewer: this.props.viewer,
      matchId: this.props.matchId,
      orientation: getOrientation(this.props.orientation),
      captureKeyEvents: this.props.captureKeyEvents
    };
    this.handleEvent = this.handleEvent.bind(this);
    this.updateClocks = this.updateClocks.bind(this);
  }

  buildConfigFromProps(props) {
    const config = {events: {}};
    Object.keys(propTypes).forEach(k => {
      const v = props[k];
      if (typeof v !== 'undefined') {
        const match = k.match(/^on([A-Z]\S*)/);
        if (match) {
          config.events[match[1].toLowerCase()] = v;
        } else {
          config[k] = v;
        }
      }
    });
    return config
  }

  updateClocks() {
    this.clockInterval = setInterval(() => {
      let {pauseClocks, pausePosition, homeClock, awayClock, moving} = this.state;

      if (pauseClocks || pausePosition) {
        return;
      }

      if (homeClock <= 0 || awayClock <= 0) {
        return clearInterval(this.clockInterval);
      }

      switch (moving) {
        case 'home':
          homeClock = homeClock.subtract(1, 's');
          this.setState({
            homeClock: homeClock,
            homeHours: homeClock.hours(),
            homeMinutes: homeClock.minutes(),
            homeSeconds: homeClock.seconds()
          });
          break;
        case 'away':
          awayClock = awayClock.subtract(1, 's');
          this.setState({
            awayClock: awayClock,
            awayHours: awayClock.hours(),
            awayMinutes: awayClock.minutes(),
            awaySeconds: awayClock.seconds()
          });
          break;
        default:
      }
    }, 1000);
  }

  stopUpdatingClocks() {
    clearInterval(this.clockInterval);
  }

  handleEvent(event) {
    if (!this.cg) {
      console.warn(`Board is not ready.`);
      return;
    }
    if (typeof this[event.type] !== 'function') {
      console.warn(`Unexpected board event: ${event.type}`);
      return;
    }
    this[event.type](event.data);
  }

  result(data) {
    if (this.props.onResult) {
      this.props.onResult(this.boardName, data);
    }
    this.setState({
      pauseClocks: true,
      pausePosition: true
    });
  }

  goto(data) {
    const orientation = getOrientation(data.orientation || this.state.orientation);
    const moveList = data.moveList || [];
    const currentMove = data.id || moveList.length;

    if (!this.state.viewOnly && moveList.length && moveList.indexOf(null) === -1) {
      this.cj.reset();
      for (let i = 0; i < currentMove; ++i) {
        this.cj.move(moveList[i]);
      }
    } else {
      this.cj.load(data.fen);
    }

    const newTurnColor = this.cj.turn() === 'w' ? 'white' : 'black';
    this.cg.set({
      fen: this.cj.fen(),
      turnColor: newTurnColor,
      orientation: orientation,
      lastMove: data.from ? [data.from, data.to] : undefined,
      movable: {
        color: newTurnColor,
        dests: availableMoves(this.cj)
      }
    });
    this.setState({
      moving: data.moving || 'home',
      moveList: moveList,
      pauseClocks: data.pauseClocks || !data.clock || moveList.length === 0,
      pausePosition: false,
      currentMove: currentMove,
      orientation: orientation
    });
    if (typeof data.result !== 'undefined' && data.result !== null) {
      this.setState({
        hasResult: true
      });
      this.result(data);
    } else {
      if (this.state.hasResult) {
        this.result({});
        this.setState({
          hasResult: false
        });
      }
    }
    const loading = !!data.loading;
    if (loading !== this.state.loading) {
      if (this.props.onLoading) {
        this.props.onLoading(this.boardName, loading);
      }
      this.setState({
        loading: loading
      });
    }
    if (!data.clock) {
      return;
    }
    const homeClock = duration().add(data.clock[0], 's');
    const awayClock = duration().add(data.clock[1], 's');
    this.setState({
      homeClock: homeClock,
      homeHours: homeClock.hours(),
      homeMinutes: homeClock.minutes(),
      homeSeconds: homeClock.seconds(),
      awayClock: awayClock,
      awayHours: awayClock.hours(),
      awayMinutes: awayClock.minutes(),
      awaySeconds: awayClock.seconds()
    });
  }

  draw(data) {
    this.cg.setShapes(data.draw);
  }

  orientation(data) {
    this.setState({orientation: getOrientation(data.orientation)});
  }

  finished(data) {
    this.setState({
      pauseClock: true,
      pausePosition: true,
      winner: data.winner
    });
  }

  componentDidMount() {
    this.cg = NativeChessground(this.chessBoard, this.buildConfigFromProps(this.props));
    this.cj = new Chess();
    this.socket = this.props.socket;
    this.boardName = `${this.props.viewOnly ? 'viewer:' : ''}${this.props.boardName}`;
    this.socket.on(this.boardName, this.handleEvent);
    if (this.props.orientation) {
      this.setState({orientation: getOrientation(this.props.orientation)});
    }
    this.stopUpdatingClocks();
    this.socket.emit(`${this.boardName}:start`, {
      orientation: this.state.orientation
    });
    this.updateClocks();
    this.attachMovableConfig();
    this.addCaptureKeyEvents();
  }

  attachMovableConfig() {
    if (this.props.viewOnly || !this.props.onMoveFen) {
      return this.cg.set({
        movable: {
          free: false
        }
      });
    }
    this.cg.set({
      movable: {
        free: false,
        turnColor: this.cj.turn() === 'w' ? 'white' : 'black',
        dests: availableMoves(this.cj),
        events: {
          after: (from, to, ...args) => {
            const move = {from, to};
            this.checkAndWaitForPromotion(move, (move) => {
              this.cj.move(move);
              this.updateAndEmitBoard();
            });
          }
        }
      }
    });
  }

  checkAndWaitForPromotion(move, next) {
    if (this.props.viewOnly || (this.cj.get(move.from) || {}).type !== 'p') {
      return setTimeout(() => next(move), 0);
    }
    const fromRank = parseInt(move.from[move.from.length - 1]);
    const toRank = parseInt(move.to[move.to.length - 1]);
    if (!(fromRank === 2 && toRank === 1) && !(fromRank === 7 && toRank === 8)) {
      return setTimeout(() => next(move), 0);
    }
    this.setState({
      requestingPromotion: (piece) => {
        move.promotion = piece || 'q';
        this.setState({requestingPromotion: false});
        setTimeout(() => next(move), 0);
      }
    });
  }

  addCaptureKeyEvents() {
    if (this.state.captureKeyEvents !== true) {
      return;
    }
    const captureKeyEventFunction = (event) => {
      switch (event.key) {
        case 'ArrowLeft':
          this.setCurrentMove(this.state.currentMove - 1);
          break;
        case 'ArrowRight':
          this.setCurrentMove(this.state.currentMove + 1);
          break;
        default:
      }
    };
    document.body.addEventListener('keydown', captureKeyEventFunction);
    this.setState({
      captureKeyEvents: captureKeyEventFunction
    });
  }

  removeCaptureKeyEvents() {
    if (typeof this.state.captureKeyEvents === 'function' || typeof this.state.captureKeyEvents === 'object') {
      document.body.removeEventListener('keydown', this.state.captureKeyEvents);
    }
  }

  componentWillReceiveProps(nextProps) {
    this.setState({viewer: nextProps.viewer});
    const orientation = getOrientation(nextProps.orientation);
    if (nextProps.orientation) {
      this.setState({orientation: orientation});
    }
    this.stopUpdatingClocks();
    this.socket.emit(`${this.boardName}:start`, {
      orientation: orientation
    });
    this.updateClocks();
    this.attachMovableConfig();
    this.addCaptureKeyEvents();
  }

  componentWillUnmount() {
    this.stopUpdatingClocks();
    this.cg.destroy();
    this.cj = null;
    this.socket.off(this.boardName, this.handleEvent);
    this.removeCaptureKeyEvents();
  }

  updateAndEmitBoard() {
    const newTurnColor = this.cj.turn() === 'w' ? 'white' : 'black';
    this.cg.set({
      fen: this.cj.fen(),
      turnColor: newTurnColor,
      movable: {
        color: newTurnColor,
        dests: availableMoves(this.cj)
      }
    });
    const moveList = this.cj.history();
    let newMoveList = [];
    let overwriteMoveList = false;
    for (let i = 0, count = moveList.length; i < count; ++i) {
      if (moveList[i] !== this.state.moveList[i]) {
        overwriteMoveList = true;
      }
      newMoveList.push(moveList[i]);
    }
    if (!overwriteMoveList && this.state.moveList.length > moveList.length) {
      newMoveList = this.state.moveList;
    }
    this.setState({
      currentMove: moveList.length,
      moveList: newMoveList
    })
    this.socket.emit(`${this.boardName}:move`, {
      id: this.cj.history().length,
      clock: this.state.clock,
      fen: this.cj.fen(),
      moveList: newMoveList
    });
  }

  render() {
    const props = {style: {...this.props.style}};
    if (this.props.width) {
      props.style.width = this.props.width;
    }
    if (this.props.height) {
      props.style.height = this.props.height;
    }

    const awayActive = this.state.moving === 'away' ? ' active' : '';
    const awayFlagged = !this.state.awayClock ? ' flagged' : '';
    const awayClock = parseClock(this.state.awayHours, this.state.awayMinutes, this.state.awaySeconds);

    const homeActive = this.state.moving === 'home' ? ' active' : '';
    const homeFlagged = !this.state.homeClock ? ' flagged' : '';
    const homeClock = parseClock(this.state.homeHours, this.state.homeMinutes, this.state.homeSeconds);
    const maxMove = this.state.moveList.length;
    const awayClockHolder = React.createElement('div', {className: `clock awayClock${awayActive}${awayFlagged}`}, awayClock);
    const homeClockHolder = React.createElement('div', {className: `clock homeClock${homeActive}${homeFlagged}`}, homeClock);

    return React.createElement('div', {className: 'board'}, [
      React.createElement('div', {
        ref: el => this.chessBoard = el,
        style: {height: this.props.size, width: this.props.size}
      }),
      React.createElement('div', {className: 'eventData'}, [
        this.state.orientation === 'home' ? awayClockHolder : homeClockHolder,
        React.createElement('div', {className: 'moveList'},
          this.state.moveList.length
            ? this.state.moveList.map((move, i) => React.createElement('span', {
              className: i + 1 === this.state.currentMove ? 'active' : '',
              onClick: () => this.setCurrentMove(i + 1, i === maxMove)
            }, move))
            : React.createElement('div', {className: 'waiting'}, 'Waiting to begin...')
        ),
        this.state.orientation === 'home' ? homeClockHolder : awayClockHolder,
        this.addSeekButtons(maxMove)
      ]),
      React.createElement('div', {className: `promotion-selector ${this.state.requestingPromotion ? 'fadeIn' : 'fadeOut'}`}, [
        React.createElement('div', {}, [
          React.createElement('div', {className: 'btn-group', role: 'group'}, [
            React.createElement('button', {
              className: `btn btn-lg btn-primary`,
              onClick: () => this.state.requestingPromotion('q')
            }, React.createElement('strong', {}, ['Queen'])),
            React.createElement('button', {
              className: `btn btn-lg btn-secondary`,
              onClick: () => this.state.requestingPromotion('r')
            }, React.createElement('strong', {}, ['Rook'])),
            React.createElement('button', {
              className: `btn btn-lg btn-secondary`,
              onClick: () => this.state.requestingPromotion('b')
            }, React.createElement('strong', {}, ['Bishop'])),
            React.createElement('button', {
              className: `btn btn-lg btn-secondary`,
              onClick: () => this.state.requestingPromotion('n')
            }, React.createElement('strong', {}, ['Knight']))
          ])
        ])
      ])
    ]);
  }

  addSeekButtons(maxMove) {
    if (this.props.viewOnly) {
      return '';
    }
    return React.createElement('div', {className: 'ml-auto actions'}, [
      React.createElement('button', {
          className: `btn btn-${this.state.currentMove - 1 <= 0 ? 'secondary' : 'primary'}`,
          onClick: () => this.setCurrentMove(0),
          disabled: this.state.currentMove - 1 <= 0
        },
        React.createElement('i', {className: 'fas fa-step-backward'})
      ),
      React.createElement('button', {
          className: `btn btn-${this.state.currentMove - 1 <= 0 ? 'secondary' : 'primary'}`,
          onClick: () => this.setCurrentMove(this.state.currentMove - 1),
          disabled: this.state.currentMove - 1 <= 0
        },
        React.createElement('i', {className: 'fas fa-backward'})
      ),
      React.createElement('button', {
          className: `btn btn-${this.state.currentMove >= maxMove ? 'secondary' : 'primary'}`,
          onClick: () => this.setCurrentMove(this.state.currentMove + 1),
          disabled: this.state.currentMove >= maxMove
        },
        React.createElement('i', {className: 'fas fa-forward'})
      ),
      React.createElement('button', {
          className: `btn btn-${this.state.currentMove >= maxMove ? 'secondary' : 'primary'}`,
          onClick: () => this.setCurrentMove(maxMove),
          disabled: this.state.currentMove >= maxMove
        },
        React.createElement('i', {className: 'fas fa-step-forward'})
      )
    ])
  }

  setCurrentMove(newCurrentMove) {
    this.cj.reset();
    for (let i = 0; i < newCurrentMove; ++i) {
      this.cj.move(this.state.moveList[i]);
    }
    this.setState({currentMove: newCurrentMove});
    this.updateAndEmitBoard();
  }
}
