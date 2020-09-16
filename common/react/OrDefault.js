import React from 'react';
import parser from 'html-react-parser';

const __ = React.createElement;

class OrDefault extends React.Component {
  render() {
    const {value, defaultValue, parse} = this.props;
    if (value === undefined || value === null || value === '') {
      const content = defaultValue
        ? defaultValue
        : 'TBD';
      return __('em', {}, parse ? parser(content) : content);
    }
    return __(React.Fragment, {}, parse ? parser(value) : value);
  }
}

export default OrDefault;
