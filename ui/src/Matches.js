import React from 'react';
import TitleBar from './TitleBar';
import Match from './Match';
import LoadingScreen from './LoadingScreen';
import Sponsors from './Sponsors';
import './Matches.css';
import ScratchBoard from './ScratchBoard';

function Matches(props) {
  const {
    configurationData,
    firstMatchData,
    secondMatchData,
    isLive,
    observingMatch,
    observingGame,
    examiningGame,
    socket
  } = props;

  return (
    <div className={'Matches'}>
      <div className={`match ${observingMatch === 1 && isLive ? 'fadeIn' : 'fadeOut'}`}>
        {firstMatchData
          ? <Match
            observingGame={observingGame}
            matchData={firstMatchData}
            showProgrammaticBoards={configurationData.showProgrammaticBoards}
            socket={socket}
          />
          : ''}
      </div>
      <div className={`match ${observingMatch === 2 && isLive ? 'fadeIn' : 'fadeOut'}`}>
        {secondMatchData
          ? <Match
            observingGame={observingGame}
            matchData={secondMatchData}
            showProgrammaticBoards={configurationData.showProgrammaticBoards}
            socket={socket}
          />
          : ''}
      </div>
      <LoadingScreen isLive={isLive} nextRoundStart={configurationData.nextRoundStart}/>
      <TitleBar
        bottomLeftText={configurationData.bottomLeftText}
        bottomMiddleText={configurationData.bottomMiddleText}
        bottomRightText={configurationData.bottomRightText}
      />
      <Sponsors observingGame={observingGame} showSponsorUnit={configurationData.showSponsorUnit}/>
      <div className={`Logo ${observingGame ? 'Right' : 'Center'}`}/>
      <ScratchBoard
        showScratchBoard={configurationData.showScratchBoard}
        observingGame={observingGame}
        examiningGame={examiningGame}
        socket={socket}
      />
    </div>
  );
}

export default Matches;
