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
        <div className="splash-spinner" />
        <p className="splash-loading-text">Loading Pic-Pocket...</p>
      </div>
    </div>
  );
}

export default Splash;
