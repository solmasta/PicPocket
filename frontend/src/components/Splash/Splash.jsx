import React from 'react';
import './Splash.css';
import splashImage from '../../assets/faye-pic-pocket.jpg';

function Splash() {
  return (
    <div
      className="splash-screen"
      style={{ backgroundImage: `url(${splashImage})` }}
    >
      <div className="splash-scrim" />
      <div className="splash-content">
        <div className="splash-spinner" role="status" aria-label="Loading PicPocket">
          <div className="splash-spinner__ring" />
        </div>
        <h1 className="splash-title">PicPocket</h1>
        <p className="splash-text">Loading your memories...</p>
      </div>
    </div>
  );
}

export default Splash;