import React from 'react';
import './TitleBar.css';

const __ = React.createElement;

function TitleBar(props) {
  const {bottomLeftText, bottomMiddleText, bottomRightText} = props;

  if (!bottomLeftText && !bottomMiddleText && !bottomRightText) {
    return <></>;
  }

  return <div className="TitleBar">
    {bottomLeftText
      ? <div className="TeamName" dangerouslySetInnerHTML={{__html: bottomLeftText}}/>
      : <></>}
    {bottomMiddleText
      ? <div className="MatchName" dangerouslySetInnerHTML={{__html: bottomMiddleText}}/>
      : <></>}
    {bottomRightText
      ? <div className="Host" dangerouslySetInnerHTML={{__html: bottomRightText}}/>
      : <></>}
  </div>;
}

export default TitleBar;
