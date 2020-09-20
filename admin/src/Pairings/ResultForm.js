import React from 'react';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import ToggleButton from 'react-bootstrap/ToggleButton';

function ResultForm(props) {
  const {result, isNotReady, pairingId, updateResult} = props;

  const checkResult = (event) => {
    if (event.target.checked && Number(event.target.value) === result) {
      event.target.checked = false;
      updateResult(pairingId, null);
    }
  };
  const handleResult = (event) => {
    updateResult(pairingId, Number(event.target.value));
  };

  const pairingName = `pairing-${pairingId}`;
  const hasResult = result !== null;
  const isWin = hasResult && result === 1;
  const isDraw = hasResult && result === 0.5;
  const isLoss = hasResult && result === 0;

  return <ButtonGroup toggle>
    <ToggleButton
      checked={isWin}
      disabled={isNotReady}
      name={pairingName}
      type="radio"
      value={1}
      onClick={checkResult}
      onChange={handleResult}
      variant={isWin || !hasResult ? "success" : "secondary"}>W</ToggleButton>
    <ToggleButton
      checked={isDraw}
      disabled={isNotReady}
      name={pairingName}
      type="radio"
      value={0.5}
      onClick={checkResult}
      onChange={handleResult}
      variant={isDraw || !hasResult ? "warning" : "secondary"}>D</ToggleButton>
    <ToggleButton
      checked={isLoss}
      disabled={isNotReady}
      name={pairingName}
      type="radio"
      value={0}
      onClick={checkResult}
      onChange={handleResult}
      variant={isLoss || !hasResult ? "danger" : "secondary"}>L</ToggleButton>
  </ButtonGroup>;
}

export default ResultForm;
