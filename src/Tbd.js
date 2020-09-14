import React from 'react';

function Tbd(props) {
  if (props.value === undefined || props.value === null || props.value === '') {
    return (
      <em>TBD</em>
    );
  }
  return props.value;
}

export default Tbd;
