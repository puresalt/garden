import React from 'react';
import OrDefault from 'gscc-common/react/OrDefault';

class Score extends React.Component {
  render() {
    const {homeTeamName, homeTeamScore, awayTeamName, awayTeamScore} = this.props;
    return (
      <div className="MatchResultBar">
        <OrDefault value={homeTeamName}/> <span>{homeTeamScore}</span> - <span>{awayTeamScore}</span> <OrDefault
        value={awayTeamName}/>
      </div>
    );
  }
}

export default Score;
