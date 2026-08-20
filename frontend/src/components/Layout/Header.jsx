import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import './Header.css';
import logo from '../../assets/pic-pocket-logo.png';

function Header({ user, tokenExpired, onSignOut, onReconnect, onToggleSidebar }) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          className="header-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="header-brand">
          <img src={logo} alt="PicPocket" className="header-logo" />
          <span className="header-title">PicPocket</span>
        </div>
      </div>

      <div className="header-center">
        {tokenExpired && (
          <div className="header-alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>Session expired</span>
            <button className="header-alert-btn" onClick={onReconnect}>Reconnect</button>
          </div>
        )}
      </div>

      <div className="header-right">
        <button
          className="header-icon-btn"
          onClick={toggleTheme}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        {user && (
          <div className="header-user">
            <div className="header-avatar">
              {user.picture && !avatarFailed ? (
                <img
                  src={user.picture}
                  alt={user.name || user.email || 'User'}
                  onError={() => setAvatarFailed(true)}
                />
              ) : (
                <span className="header-avatar-fallback">
                  {user.name?.[0] || user.email?.[0] || '👤'}
                </span>
              )}
            </div>
            <div className="header-user-info">
              <span className="header-user-name">{user.name || user.email}</span>
              {user.isLocal && <span className="header-user-badge">Local</span>}
            </div>
            <button
              className="header-signout-btn"
              onClick={onSignOut}
              aria-label="Sign out"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;