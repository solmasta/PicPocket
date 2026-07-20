import React from 'react';
import './Header.css';

function Header({ user, onSignOut, onToggleSidebar }) {
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
          <span className="logo-icon">📸</span>
          <span className="logo-text">PickPocket Hints Pictures Photos</span>
        </div>
      </div>

      <div className="header-right">
        {user && (
          <div className="user-menu">
            <img
              src={user.picture}
              alt={user.name}
              className="user-avatar"
              referrerPolicy="no-referrer"
            />
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
