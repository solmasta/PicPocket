import React from 'react';
import packageJson from '../../../package.json';
import './Footer.css';

function Footer() {
  return (
    <footer className="app-footer">
      <p>
        © {new Date().getFullYear()} Pic-Pocket — Your memories, beautifully kept.
        {' '}
        <span className="app-footer__version">v{packageJson.version}</span>
      </p>
    </footer>
  );
}

export default Footer;
