import React, { useState } from 'react';
import './Header.css';
import logo from '../../logo.svg';

function Header({ user, onSignOut, onToggleSidebar }) {
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
              <div className="user-avatar user-avatar-fallback" aria-label={user.name}>
                {user.name ? user.name.charAt(0).toUpperCase() : '?'}
              </div>
            )}
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-email">{user.email}</span>
            </div>
            <button className="sign-out-btn" onClick={onSignOut}>
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
