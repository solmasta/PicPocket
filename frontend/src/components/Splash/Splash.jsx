import React from 'react';
import './Splash.css';
import splashImage from '../../assets/faye-pic-pocket.jpg';
import logo from '../../assets/pic-pocket-logo.png';

const SPARKLES = Array.from({ length: 7 }, (_, i) => i);

function Splash() {
  return (
    <div
      className="splash-screen"
      style={{ backgroundImage: `url(${splashImage})` }}
    >
      <div className="splash-scrim" />
      <div className="splash-sparkles">
        {SPARKLES.map((i) => (
          <span key={i} className="sparkle" />
        ))}
      </div>
      <div className="splash-content">
        <div className="splash-logo">
          <img src={logo} alt="Pic-Pocket" />
        </div>
        <div className="splash-welcome">
          <h1>Welcome to Pic-Pocket! ✨</h1>
          <p>Your magical photo memories await...</p>
        </div>
        <div className="splash-spinner" role="status" aria-label="Loading" />
        <p className="splash-loading-text">Loading your memories...</p>
      </div>
    </div>
  );
}

export default Splash;