import React from 'react'
import { duration } from 'moment';
import PropTypes from 'prop-types'
import { Chessground as NativeChessground } from 'chessground'
import './Chessboard/css/chessground.css';

const highlightSquareRegex = /([a-h][1-8])/;
const isPawnToTheDangerSquareMove = /^([a-h][4|5])$/;
const pawnCaptureRegex = /^([a-h]x)/;
const promotionRegex = /=([QRKB])$/;
const roles = {Q: 'queen', R: 'rook', K: 'king', B: 'bishop'};

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
  onDropNewPiece: PropTypes.func,
  onSelect: PropTypes.func,
  items: PropTypes.object,
  drawable: PropTypes.object,
  socket: PropTypes.object
};

export default class Chessground extends React.PureComponent {
  constructor(props) {
    super(props);
    const homeClock = duration().add(this.props.timeLimt || 3600, 's');
    const awayClock = duration().add(this.props.timeLimt || 3600, 's');
    this.state = {
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
      orientation: this.props.orientation || 'white'
    };
    this.handleEvent = this.handleEvent.bind(this);
    this.sendEvent = this.sendEvent.bind(this);
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

  sendEvent(id) {
    this.setState({pausePosition: true, pauseClocks: true});
    if (!this.socket) {
      console.warn(`Socket is not ready.`);
      return;
    }
    this.socket.emit(`${this.boardName}:goto`, {id: id, paused: id < this.state.moveList.length});
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

  move(data) {
    const pawnCapture = data.pgn.match(pawnCaptureRegex);
    if (pawnCapture) {
      console.log('isPawnCapture?', pawnCapture, pawnCapture[0][0], data.move[0][0]);
      const lastMove = this.state.moveList[this.state.moveList.length - 1];
      const lastMoveWasIt = lastMove.match(isPawnToTheDangerSquareMove);
      if (lastMoveWasIt) {
        console.log({[lastMoveWasIt[0]]: null});
        this.cg.setPieces([[lastMoveWasIt[0], null]]);
      }
    }

    this.cg.move(data.move[0], data.move[1]);
    const promote = data.pgn.match(promotionRegex);
    if (promote) {
      this.cg.setPieces([[data.move[1], {
        promoted: true,
        color: data.moving === 'home' ? 'white' : 'black',
        role: roles[promote[1]]
      }]]);
    }

    this.cg.setShapes([]);
    this.setState({
      moving: data.moving,
      currentMove: data.id,
      pauseClocks: false
    });
    if (data.id > this.state.moveList.length) {
      const moveList = this.state.moveList.map(item => item);
      moveList.push(data.pgn);
      this.setState({moveList: moveList});
    }
    if (data.clock === null) {
      return;
    }
    let homeClock = duration().add(data.clock[0], 's');
    let awayClock = duration().add(data.clock[1], 's');
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

  goto(data) {
    const orientation = data.orientation || this.state.orientation;
    this.cg.set({fen: data.fen, orientation: orientation === 'home' ? 'white' : 'black'});
    const highlightSquare = (data.pgn || '').match(highlightSquareRegex);
    this.cg.cancelMove();
    if (highlightSquare) {
      this.cg.selectSquare(highlightSquare[1]);
    }
    this.cg.setShapes([]);
    const moveList = data.moveList || [];
    this.setState({
      moving: data.moving || 'home',
      moveList: moveList,
      pauseClocks: moveList.length === 0,
      pausePosition: false,
      currentMove: data.id || moveList.length,
      orientation: orientation
    });
    if (data.clock === null) {
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
    this.setState({orientation: data.orientation});
  }

  finished(data) {
    this.setState({
      pauseClock: true,
      pausePosition: true,
      winner: data.winner
    });
    this.socket.emit('pairing:list', this.state.matchId);
  }

  componentDidMount() {
    this.cg = NativeChessground(this.chessBoard, this.buildConfigFromProps(this.props));
    this.socket = this.props.socket;
    this.boardName = `${this.props.viewOnly ? 'viewer:' : ''}${this.props.boardName}`;
    this.socket.on(this.boardName, this.handleEvent);
    if (this.props.orientation) {
      this.setState({orientation: this.props.orientation});
    }
    if (this.state.viewer) {
      this.stopUpdatingClocks();
      this.socket.emit(`${this.boardName}:start`, {
        orientation: this.state.orientation
      });
      this.updateClocks();
    }
  }

  componentWillReceiveProps(nextProps) {
    this.setState({viewer: nextProps.viewer});
    if (nextProps.orientation) {
      this.setState({orientation: nextProps.orientation});
    }
    this.stopUpdatingClocks();
    this.socket.emit(`${this.boardName}:start`, {
      orientation: nextProps.orientation || this.state.orientation
    });
    if (nextProps.viewer) {
      this.updateClocks();
    }
  }

  componentWillUnmount() {
    this.stopUpdatingClocks();
    this.cg.destroy();
    this.socket.off(this.boardName, this.handleEvent);
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
    const maxMove = this.state.moveList.length - 1;
    const setCurrentMove = (newCurrentMove, latest) => {
      this.setState({
        currentMove: newCurrentMove,
        pausePosition: !latest,
        pauseClocks: !latest
      });
      this.socket.emit(`${this.boardName}:goto`, {
        id: newCurrentMove,
        paused: !latest,
        stopJumping: !latest
      });
    };
    const changePlayState = (newPlayState) => {
      if (!newPlayState && !this.state.moveList.length) {
        this.socket.emit(`${this.boardName}:start`, {orientation: this.state.orientation});
        return;
      }
      this.setState({pausePosition: newPlayState});
      this.socket.emit(`${this.boardName}:pause`, newPlayState);
    };

    return React.createElement('div', {className: 'board'}, [
      React.createElement('div', {
        ref: el => this.chessBoard = el,
        style: {height: this.props.size, width: this.props.size}
      }),
      React.createElement('div', {className: 'eventData'}, [
        React.createElement('div', {className: `clock homeClock${awayActive}${awayFlagged}`}, awayClock),
        React.createElement('div', {className: 'moveList'},
          this.state.moveList.length
            ? this.state.moveList.map((move, i) => React.createElement('span', {
              className: i + 1 === this.state.currentMove ? 'active' : '',
              onClick: () => setCurrentMove(i, i + 1 === maxMove)
            }, move))
            : React.createElement('div', {className: 'waiting'}, 'Waiting to begin...')
        ),
        React.createElement('div', {className: `clock homeClock${homeActive}${homeFlagged}`}, homeClock),
        this.props.viewOnly ? '' : React.createElement('div', {className: 'ml-auto actions'}, [
          React.createElement('button', {
              className: `btn btn-sm btn-${!this.state.currentMove ? 'secondary' : 'primary'}`,
              onClick: () => setCurrentMove(0),
              disabled: !this.state.currentMove
            },
            React.createElement('i', {className: 'fas fa-step-backward'})
          ),
          React.createElement('button', {
              className: `btn btn-sm btn-${!this.state.currentMove ? 'secondary' : 'primary'}`,
              onClick: () => setCurrentMove(this.state.currentMove - 2),
              disabled: !this.state.currentMove
            },
            React.createElement('i', {className: 'fas fa-backward'})
          ),
          React.createElement('button', {
              className: `btn btn-sm btn-${this.state.pausePosition ? 'success' : 'danger'}`,
              onClick: () => changePlayState(!this.state.pausePosition)
            },
            React.createElement('i', {className: `fas fa-${this.state.pausePosition ? 'play' : 'pause'}`})
          ),
          React.createElement('button', {
              className: `btn btn-sm btn-${this.state.currentMove === maxMove ? 'secondary' : 'primary'}`,
              onClick: () => setCurrentMove(this.state.currentMove),
              disabled: !this.state.currentMove === maxMove
            },
            React.createElement('i', {className: 'fas fa-forward'})
          ),
          React.createElement('button', {
              className: `btn btn-sm btn-${this.state.currentMove === maxMove ? 'secondary' : 'primary'}`,
              onClick: () => setCurrentMove(maxMove),
              disabled: !this.state.currentMove === maxMove
            },
            React.createElement('i', {className: 'fas fa-forward'})
          )
        ])
      ])
    ]);
  }
}
