import React from 'react';
import './TitleBar.css';

const __ = React.createElement;

function TitleBar(props) {
  const {bottomLeftText, bottomMiddleText, bottomRightText} = props;

  if (!bottomLeftText && !bottomMiddleText && !bottomRightText) {
    return <></>;
  }

  return <div className="TitleBar">
    {bottomLeftText ? <div className="TeamName">{__(React.Fragment, {}, bottomLeftText)}</div> : <></>}
    {bottomMiddleText ? <div className="MatchName">{__(React.Fragment, {}, bottomMiddleText)}</div> : <></>}
    {bottomRightText ? <div className="Host">{__(React.Fragment, {}, bottomRightText)}</div> : <></>}
  </div>;
}

export default TitleBar;
