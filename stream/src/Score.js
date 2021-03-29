import React, { useEffect, useState } from 'react';
import './Score.css';

function Score(props) {
  const {homeTeamId, awayTeamId, observingGame} = props;

  const [images, setImages] = useState([]);
  useEffect(() => {
    const allImagesContext = require.context(`./team/`, false, /\.(png|jpe?g|svg)$/);

    setImages(allImagesContext.keys().map(allImagesContext));
  }, []);

  const homeTeam = images[homeTeamId ? homeTeamId - 1 : 5];
  const awayTeam = images[awayTeamId ? awayTeamId - 1 : 5];

  return <div className={`Score ${observingGame ? 'Right' : 'Center'}`}>
    <div className={'home'}>{<img alt={homeTeam} src={homeTeam}/>}</div>
    <div className={'away'}>{<img alt={awayTeam} src={awayTeam}/>}</div>
  </div>;
}

export default Score;
