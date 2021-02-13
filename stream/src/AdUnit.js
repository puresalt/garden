import React, { useEffect, useState } from 'react';
import { Fade } from 'react-slideshow-image';
import 'react-slideshow-image/dist/styles.css';
import './AdUnit.css';

function AdUnit(props) {
  const {showAdUnit, small, large} = props;

  const [images, setImages] = useState([]);
  const [smallBoardImages, setSmallBoardImages] = useState([]);
  const [largeBoardImage, setLargeBoardImages] = useState([]);
  useEffect(() => {
    const allImagesContext = require.context(`./ad/`, false, /\.(png|jpe?g|svg)$/);
    const allSmallImagesContext = require.context(`./ad/small/`, false, /\.(png|jpe?g|svg)$/);
    const allLargeImagesContext = require.context(`./ad/large/`, false, /\.(png|jpe?g|svg)$/);

    setImages(allImagesContext.keys().map(allImagesContext));
    setSmallBoardImages(allSmallImagesContext.keys().map(allImagesContext));
    setLargeBoardImages(allLargeImagesContext.keys().map(allImagesContext));
  }, []);

  const useImages = large ? largeBoardImage : (small ? smallBoardImages : images);
  if (!showAdUnit || !useImages.length) {
    return <></>;
  }

  return (
    <div className="ImageCarousel">
      {useImages.length === 1
        ? <img alt="ad #1" src={images[0]}/>
        : <Fade arrows={false} indicators={false}>
          {useImages.map((each, i) => <img alt={`ad #${i + 1}`} key={i} src={each}/>)}
        </Fade>}
    </div>
  );
}

export default AdUnit;
