import React from 'react';
import './Footer.css';

function Footer() {
  return (
    <footer className="app-footer">
      <div className="app-footer__content">
        <p className="app-footer__text">
          © {new Date().getFullYear()} PicPocket — Your memories, beautifully kept.
        </p>
        <div className="app-footer__links">
          <span className="app-footer__version">v1.0.0</span>
          <span className="app-footer__separator">•</span>
          <span className="app-footer__tech">React + Cloudflare Workers</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;