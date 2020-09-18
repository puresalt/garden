import React from 'react';

function LoadingOverlayText() {
  return <>
    <div className="spinner-grow text-success" role="status">
      <span className="sr-only">Loading...</span>
    </div>
  </>;
}

export default LoadingOverlayText;
