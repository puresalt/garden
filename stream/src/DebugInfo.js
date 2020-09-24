import React from 'react';
import './DebugInfo.css';

function DebugInfo(props) {
  const {left, top, width, height} = props;
  return (<div className="debug-info">
      <table>
        <thead>
        <tr>
          <th scope="col">Attribute</th>
          <th scope="col">Value</th>
        </tr>
        </thead>
        <tbody>
        <tr>
          <td>Left</td>
          <td>{left}px</td>
        </tr>
        <tr>
          <td>Top</td>
          <td>{top}px</td>
        </tr>
        <tr>
          <td>Width</td>
          <td>{width}px</td>
        </tr>
        <tr>
          <td>Height</td>
          <td>{height}px</td>
        </tr>
        </tbody>
      </table>
    </div>
  );
}

export default DebugInfo;
