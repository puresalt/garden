import React from 'react';
import './TitleBar.css';
import OrDefault from 'garden-common/react/OrDefault';

function TitleBar(props) {
  const {homeTeam} = props;

  return <div className="TitleBar">
    <div className="TeamName"><span>Garden State</span> Passers</div>
    <div className="MatchName">States Chess Cup: <span><OrDefault
      value={props.homeTeamName}/></span> vs <span><OrDefault
      value={props.awayTeamName}/></span></div>
    <div className="Host">
      HOST: {props.icons.map((item, i) => <i key={i} className={"fab fa-" + item}/>)}<OrDefault value={props.name}
                                                                                                parse={true}/>
    </div>
  </div>;
}

export default TitleBar;
