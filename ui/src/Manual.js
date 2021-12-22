import React from 'react';
import TitleBar from './TitleBar';
import LoadingScreen from './LoadingScreen';
import Sponsors from './Sponsors';

function Manual(props) {
  const {configurationData, isLive} = props;

  return (
    <div className={'Matches'}>
      <LoadingScreen isLive={isLive} nextRoundStart={configurationData.nextRoundStart}/>
      <TitleBar
        bottomLeftText={configurationData.bottomLeftText}
        bottomMiddleText={configurationData.bottomMiddleText}
        bottomRightText={configurationData.bottomRightText}
      />
      <Sponsors showSponsorUnit={configurationData.showSponsorUnit}/>
    </div>
  );
}

export default Manual;
