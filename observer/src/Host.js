import React from 'react';
import parse from 'html-react-parser';
import Tbd from './Tbd';

function Host(props) {
  const name = props.name !== null
    ? parse(props.name)
    : <Tbd/>;
  return (
    <div className="Host">
      HOST: {props.icons.map((item, i) => <i key={i} className={"fab fa-" + item}/>)}{name}
    </div>
  );
}

export default Host;
