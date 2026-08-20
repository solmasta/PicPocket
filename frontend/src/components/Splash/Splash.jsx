import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import GoogleSignIn from '../Auth/GoogleSignIn';
import './Splash.css';

const Splash = () => {
  const { t } = useTranslation();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`splash ${isLoaded ? 'loaded' : ''}`}>
      {/* Animated Background */}
      <div className="splash-bg">
        <div className="bg-gradient" />
        <div className="bg-particles">
          <span className="particle">✨</span>
          <span className="particle">🐴</span>
          <span className="particle">💫</span>
          <span className="particle">✨</span>
          <span className="particle">🌟</span>
          <span className="particle">✨</span>
        </div>
      </div>

      {/* Content */}
      <div className="splash-content">
        {/* Logo */}
        <div className="splash-logo">
          <div className="logo-badge">
            <span className="badge-icon">🐴</span>
          </div>
          <h1 className="logo-title">
            <span className="title-pic">Pic</span>
            <span className="title-pocket">Pocket</span>
          </h1>
          <p className="logo-subtitle">for Faye ✨</p>
        </div>

        {/* Tagline */}
        <div className="splash-tagline">
          <p>Your magical photo collection</p>
          <div className="tagline-decoration">
            <span className="deco-star">⭐</span>
            <span className="deco-text">Store • Share • Remember</span>
            <span className="deco-star">⭐</span>
          </div>
        </div>

        {/* Features */}
        <div className="splash-features">
          <div className="feature">
            <span className="feature-icon">📸</span>
            <span className="feature-text">Beautiful Gallery</span>
          </div>
          <div className="feature">
            <span className="feature-icon">💫</span>
            <span className="feature-text">AI Organization</span>
          </div>
          <div className="feature">
            <span className="feature-icon">☁️</span>
            <span className="feature-text">Cloud Backup</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🎠</span>
            <span className="feature-text">Photo Stories</span>
          </div>
        </div>

        {/* Sign In */}
        <div className="splash-auth">
          <GoogleSignIn />
        </div>

        {/* Footer */}
        <div className="splash-footer">
          <p>Made with 💛 for Faye</p>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="splash-decorations">
        <div className="deco-circle circle-1" />
        <div className="deco-circle circle-2" />
        <div className="deco-circle circle-3" />
      </div>
    </div>
  );
};

export default Splash;