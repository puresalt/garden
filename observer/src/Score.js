import React from 'react';
import Tbd from './Tbd';

class Score extends React.Component {
  render() {
    const {homeTeamName, homeTeamScore, awayTeamName, awayTeamScore} = this.props;
    return (
      <div className="MatchResultBar">
        <Tbd value={homeTeamName}/> <span>{homeTeamScore}</span> - <span>{awayTeamScore}</span> <Tbd value={awayTeamName}/>
      </div>
    );
  }
}

export default Score;
