import React, {useEffect, useState} from 'react';
import {Fade} from 'react-slideshow-image';
import 'react-slideshow-image/dist/styles.css';
import './AdUnit.css';

function AdUnit(props) {
  const {showAdUnit, debugMode} = props;

  const [images, setImages] = useState([]);

  useEffect(() => {
    const allImagesContext = require.context('./ad/', false, /\.(png|jpe?g|svg)$/);

    setImages(allImagesContext.keys().map(allImagesContext));
  }, []);

  if (!showAdUnit || !images.length) {
    return <></>;
  }

  return (
    <div className={`ImageCarousel${debugMode ? ' debug' : ''}`}>
      {images.length === 1
        ? <img alt="ad #1" src={images[0]}/>
        : <Fade arrows={false} indicators={false}>
          {images.map((each, i) => <img alt={`ad #${i + 1}`} key={i} src={each}/>)}
        </Fade>}
    </div>
  );
}

export default AdUnit;
