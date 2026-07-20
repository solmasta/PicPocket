import React from 'react';
import './Footer.css';

function Footer() {
  return (
    <footer className="app-footer">
      <p>
        © {new Date().getFullYear()} Pic-Pocket — Your memories, beautifully kept.
      </p>
    </footer>
  );
}

export default Footer;
