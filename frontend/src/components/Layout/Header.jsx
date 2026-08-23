import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import './Header.css';
import logo from '../../assets/pic-pocket-logo.png';

function Header({ user, tokenExpired, onSignOut, onReconnect, onToggleSidebar }) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <header className="header">
      <div className="header__logo-section">
        <button 
          className="header__menu-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          ☰
        </button>
        <a href="/" className="header__logo-link" aria-label="PicPocket Home">
          <img 
            src={logo} 
            alt="" 
            className="header__logo-img"
          />
          <span className="header__logo-text">PicPocket</span>
        </a>
      </div>

      <nav className="header__nav" role="navigation" aria-label="Main navigation">
        <button 
          className="header__nav-btn"
          onClick={toggleTheme}
          aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
        >
          {isDarkMode ? '☀️' : '🌙'}
          <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </nav>

      <div className="header__user-section">
        {user ? (
          <>
            <div className="header__user-info">
              <div className="header__user-name">{user.displayName || user.email}</div>
              <div className="header__user-status">
                {tokenExpired ? 'Token expired' : 'Connected'}
              </div>
            </div>
            {avatarFailed ? (
              <div className="header__avatar header__avatar--fallback">
                {(user.displayName || user.email || '?')[0].toUpperCase()}
              </div>
            ) : (
              <img
                src={user.photoURL}
                alt=""
                className="header__avatar"
                onError={() => setAvatarFailed(true)}
              />
            )}
            <button 
              className="header__nav-btn"
              onClick={tokenExpired ? onReconnect : onSignOut}
              aria-label={tokenExpired ? "Reconnect" : "Sign out"}
            >
              {tokenExpired ? '🔌' : '🚪'}
              <span>{tokenExpired ? 'Reconnect' : 'Sign Out'}</span>
            </button>
          </>
        ) : (
          <button 
            className="header__nav-btn"
            onClick={onSignOut}
            aria-label="Sign in"
          >
            🔐
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
}

export default Header;