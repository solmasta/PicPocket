import React, { useState } from 'react';
import './Header.css';
import logo from '../../assets/pic-pocket-logo.png';

function Header({ user, tokenExpired, onSignOut, onReconnect, onToggleSidebar }) {
  const [avatarFailed, setAvatarFailed] = useState(false);

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          className="sidebar-toggle"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <span className="hamburger-icon">☰</span>
        </button>
        <div className="app-logo">
          <img src={logo} alt="Pic-Pocket mascot logo" className="logo-icon-img" />
          <span className="logo-text">Pic-Pocket</span>
        </div>
      </div>

      <div className="header-right">
        {user && (
          <div className="user-menu">
            {user.picture && !avatarFailed ? (
              <img
                src={user.picture}
                alt={user.name}
                className="user-avatar"
                referrerPolicy="no-referrer"
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <img
                src={`${process.env.PUBLIC_URL}/logo192.png`}
                alt={user.name || 'Pic-Pocket'}
                className="user-avatar user-avatar-fallback"
              />
            )}
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-email">{user.email || (user.isLocal ? 'Local User' : '')}</span>
            </div>
            {!user.isLocal && tokenExpired && (
              <button
                className="reconnect-btn"
                onClick={onReconnect}
                title="Your Google session lapsed — reconnect to resume Drive/Photos backup"
              >
                Reconnect
              </button>
            )}
            <button 
              className="sign-out-btn" 
              onClick={onSignOut}
              aria-label={`Sign out ${user.name}`}
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;