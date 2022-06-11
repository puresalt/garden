import React from 'react'
import { duration } from 'moment';
import PropTypes from 'prop-types'
import { Chessground as NativeChessground } from 'chessground';
import Chess from 'chess.js';
import './Chessboard/css/chessground.css';
import './Chessboard.css';

const DEFAULT_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const EVALUATION_REGEX = /info depth [0-9]+ seldepth [0-9]+ multipv [0-9]+ score cp ([0-9]+)/;
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
  boardId: PropTypes.number,
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
  onEvaluate: PropTypes.func,
  items: PropTypes.object,
  drawable: PropTypes.object,
  socket: PropTypes.object
};

export default class Chessground extends React.PureComponent {
  constructor(props) {
    super(props);
    const homeClock = duration().add(this.props.timeLimt || 900, 's');
    const awayClock = duration().add(this.props.timeLimt || 900, 's');
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
      currentMove: 0,
      viewer: this.props.viewer,
      matchId: this.props.matchId,
      orientation: getOrientation(this.props.orientation),
      captureKeyEvents: this.props.captureKeyEvents,
      loading: true,
      result: null
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
      let {pauseClocks, hasResult, homeClock, awayClock, moving} = this.state;

      if (pauseClocks || hasResult) {
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
      hasResult: true,
      result: data
    });
  }

  goto(data) {
    const orientation = getOrientation(data.orientation || this.state.orientation);
    const moveList = data.moveList || [];
    const currentMove = data.id || moveList.length;

    this.cj.load(data.fen);

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
      pauseClocks: !data.clock || data.id === 0,
      currentMove: currentMove,
      orientation: orientation
    });

    if (typeof data.result !== 'undefined' && data.result !== null) {
      this.setState({
        hasResult: true,
        result: data.result
      });
      this.result(data);
    } else {
      if (this.state.hasResult) {
        this.result({});
        this.setState({
          hasResult: false,
          result: null
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

    this.evaluate();
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
      winner: data.winner
    });
  }

  evaluate() {
    if (!this.evaluator) {
      return;
    }

    const fen = this.cj.fen();
    if (fen === DEFAULT_FEN) {
      return this.props.onEvaluate(0.07);
    }

    this.evaluator.postMessage('uci');
    this.evaluator.postMessage('ucinewgame');
    this.evaluator.postMessage(`position fen "${fen}"`);
    this.evaluator.postMessage(`go depth 32`);
  }

  componentDidMount() {
    this.cg = NativeChessground(this.chessBoard, this.buildConfigFromProps(this.props));
    this.cj = new Chess();
    if (this.props.onEvaluate) {
      this.evaluator = new Worker('/stockfish.js');
      this.evaluator.onmessage = (message) => {
        const incoming = message && typeof message === 'object'
          ? message.data
          : message;
        const evaluation = incoming.match(EVALUATION_REGEX);
        if (evaluation === null) {
          return;
        }
        this.props.onEvaluate(parseFloat(evaluation[1] / 100));
      };
    }
    this.socket = this.props.socket;
    this.boardName = `rapid:viewer:board:${this.props.boardId}`;
    this.socket.on(this.boardName, this.handleEvent);
    if (this.props.orientation) {
      this.setState({orientation: getOrientation(this.props.orientation)});
    }
    this.stopUpdatingClocks();
    this.setState({loading: true});
    this.updateClocks();
    this.attachMovableConfig();
  }

  attachMovableConfig() {
    return this.cg.set({
      movable: {
        free: false
      }
    });
  }

  componentWillReceiveProps(nextProps) {
    this.setState({viewer: nextProps.viewer});
    const orientation = getOrientation(nextProps.orientation);
    if (nextProps.orientation) {
      this.setState({orientation: orientation});
    }
    this.stopUpdatingClocks();
    this.setState({loading: true});
    this.updateClocks();
    this.attachMovableConfig();
  }

  componentWillUnmount() {
    this.stopUpdatingClocks();
    this.cg.destroy();
    this.cj = null;
    this.evaluator.terminate();
    this.evaluator = null;
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
    const awayClockHolder = React.createElement('div', {className: `clock awayClock${awayActive}${awayFlagged}`}, awayClock);
    const homeClockHolder = React.createElement('div', {className: `clock homeClock${homeActive}${homeFlagged}`}, homeClock);

    return React.createElement('div', {className: 'board'}, [
      React.createElement('div', {
        ref: el => this.chessBoard = el,
        style: {height: this.props.size, width: this.props.size}
      }),
      React.createElement(
        'div',
        {className: 'eventData'},
        this.state.orientation === 'home' ? [awayClockHolder, homeClockHolder] : [homeClockHolder, awayClockHolder]
      )
    ]);
  }
}
