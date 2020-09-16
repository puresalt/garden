import React, {useState} from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import ToggleButton from 'react-bootstrap/ToggleButton';
import ButtonGroup from 'react-bootstrap/ButtonGroup';

const matchUps = [
  [
    [0, 3, null],
    [1, 2, null],
    [2, 1, null],
    [3, 0, null]
  ],
  [
    [0, 2, null],
    [1, 3, null],
    [2, 0, null],
    [3, 1, null]
  ],
  [
    [0, 1, null],
    [1, 0, null],
    [2, 3, null],
    [3, 2, null]
  ],
  [
    [0, 0, null],
    [1, 1, null],
    [2, 2, null],
    [3, 3, null]
  ]
];

function Results() {
  return <div className="Results text-center">
    {matchUps.map((pairings, i) => {
      return <Round key={i} number={i + 1} pairings={pairings}/>
    })}
  </div>;
}

function Round(props) {
  const {number, pairings} = props;

  return <div className={`round-${number} pb-4`}>
    <h2 className="pb-2">Round {number}</h2>
    {pairings.map((tuple, i) => <MatchUp
      key={i}
      board={i}
      round={number}
      player={tuple[0]}
      opponent={tuple[1]}
      result={tuple[2]}/>
    )}
  </div>;
}

function MatchUp(props) {
  const {board, round, player, opponent} = props;
  const pairingName = `round-${round - 1}-${board}`;

  const [result, updateResult] = useState(props.result);

  const handleResultUpdate = (event) => {
    const newResult = Number(event.target.value);
    updateResult(result !== newResult ? newResult : null);
  };

  const checkResult = (event) => {
    if (event.target.checked) {
      event.target.checked = false;
      updateResult(null);
    }
  };

  const hasResult = result !== null;
  const isWin = hasResult && result === 1;
  const isDraw = hasResult && result === 0.5;
  const isLoss = hasResult && result === 0;
  return <Row className="mt-2">
    <Col xs={5} className="text-right">
      player.${player}.name
    </Col>
    <Col xs={2}>
      <ButtonGroup toggle>
        <ToggleButton
          checked={isWin}
          name={pairingName}
          type="radio"
          value={1}
          onClick={checkResult}
          onChange={handleResultUpdate}
          variant={isWin || !hasResult ? "success" : "secondary"}>W</ToggleButton>
        <ToggleButton
          checked={isDraw}
          name={pairingName}
          type="radio"
          value={0.5}
          onClick={checkResult}
          onChange={handleResultUpdate}
          variant={isDraw || !hasResult ? "warning" : "secondary"}>D</ToggleButton>
        <ToggleButton
          checked={isLoss}
          name={pairingName}
          type="radio"
          value={0}
          onClick={checkResult}
          onChange={handleResultUpdate}
          variant={isLoss || !hasResult ? "danger" : "secondary"}>L</ToggleButton>
      </ButtonGroup>
    </Col>
    <Col xs={5} className="text-left">
      enemy.${opponent}.name
    </Col>
  </Row>;
}

export default Results;
