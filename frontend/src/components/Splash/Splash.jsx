import React from 'react';
import './Splash.css';
import splashImage from '../../assets/faye-pic-pocket.jpg';

function Splash() {
  return (
    <div
      className="splash-screen"
      style={{ '--splash-bg-image': `url(${splashImage})` }}
    >
      <div className="splash-scrim" />
      <div className="splash-content">
        <h1 className="splash-title">Pic-Pocket</h1>
        <p className="splash-tagline">Your smart photo storage companion</p>
        <div className="splash-spinner" />
        <p className="splash-loading-text">Loading Pic-Pocket...</p>
      </div>
    </div>
  );
}

export default Splash;
