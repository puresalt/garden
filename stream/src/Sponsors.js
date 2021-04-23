import React, { useEffect, useState } from 'react';
import './Sponsors.css';
import { Fade } from 'react-slideshow-image';
import 'react-slideshow-image/dist/styles.css';

function Sponsors(props) {
  const {showSponsorUnit, observingGame} = props;

  const [images, setImages] = useState([]);
  useEffect(() => {
    const allImagesContext = require.context(`./sponsor/`, false, /\.(png|jpe?g|svg)$/);

    setImages(allImagesContext.keys().map(allImagesContext));
  }, []);

  if (!showSponsorUnit || !images.length) {
    return <></>;
  }

  return <div className={`Sponsors ${observingGame ? 'Right' : 'Center'}`}>
    {
      images.length === 1
        ? <img alt="ad #1" src={images[0]}/>
        : <Fade arrows={false} indicators={false}>
          {images.map((each, i) => <img alt={`ad #${i + 1}`} key={i} src={each}/>)}
        </Fade>
    }
  </div>;
}

export default Sponsors;
