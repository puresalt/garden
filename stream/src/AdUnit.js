import React, {useEffect, useState} from 'react';
import {Fade} from 'react-slideshow-image';
import 'react-slideshow-image/dist/styles.css';
import './AdUnit.css';
import DebugInfo from './DebugInfo';

function AdUnit(props) {
  const {showAdUnit, debugMode} = props;

  const [images, setImages] = useState([]);

  useEffect(() => {
    const allImagesContext = require.context('./ad/', false, /\.(png|jpe?g|svg)$/);

    setImages(allImagesContext.keys().map(allImagesContext));
    console.log(allImagesContext.keys().map(allImagesContext));
  }, []);

  if (!showAdUnit || !images.length) {
    return <></>;
  }

  console.log(images.length);

  return (
    <div className={`ImageCarousel${debugMode ? ' debug' : ''}`}>
      <DebugInfo left={1430} top={90} height={600} width={450}/>
      {images.length === 1
        ? <img alt="ad #1" src={images[0]}/>
        : <Fade arrows={false} indicators={false}>
          {images.map((each, i) => <img alt={`ad #${i + 1}`} key={i} src={each}/>)}
        </Fade>}
    </div>
  );
}

export default AdUnit;
