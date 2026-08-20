import { useState, useEffect } from 'react';
import { getAutoBackupPref, setAutoBackupPref } from '../../utils/preferences';
import { isGoogleAuthConfigured } from '../../config/googleAuth';
import './Settings.css';

export default function Settings({ user, storageConnections, onSignInGoogle, onContinueLocally, onSignOut }) {
  const [autoBackup, setAutoBackup] = useState(() => getAutoBackupPref());
  const [showLocalWarning, setShowLocalWarning] = useState(false);

  useEffect(() => {
    setAutoBackupPref(autoBackup);
  }, [autoBackup]);

  const cloudProviders = [
    {
      id: 'google',
      name: 'Google Drive',
      icon: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg',
      connected: storageConnections?.google,
      status: 'google',
    },
    {
      id: 'googlePhotos',
      name: 'Google Photos',
      icon: 'https://lh3.googleusercontent.com/SiocFDNolDDBydCDiDXAyFkI5gqKx3tPRNV-6Z9CAc8hVocQpgJ2p9U2RDvKfpWYg=s64',
      connected: storageConnections?.googlePhotos,
      status: 'googlePhotos',
    },
    {
      id: 'dropbox',
      name: 'Dropbox',
      icon: 'https://dropbox.com/static/images/brand_assets/logos_faq/DB_Logo_2015.png',
      connected: storageConnections?.dropbox,
      status: 'dropbox',
    },
    {
      id: 'onedrive',
      name: 'OneDrive',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Microsoft_logo_-_2012.svg/64px-Microsoft_logo_-_2012.svg.png',
      connected: storageConnections?.oneDrive,
      status: 'oneDrive',
    },
  ];

  return (
    <div className="settings">
      <div className="settings__header">
        <h1>Settings</h1>
        <p>Manage your account and storage preferences</p>
      </div>

      {/* Account Section */}
      <section className="settings__section">
        <h2 className="settings__section-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Account
        </h2>
        <div className="settings__card">
          <div className="settings__account-info">
            <div className="settings__account-avatar">
              {user?.picture ? (
                <img src={user.picture} alt={user.name || 'User'} />
              ) : (
                <span>{user?.name?.[0] || user?.email?.[0] || '👤'}</span>
              )}
            </div>
            <div className="settings__account-details">
              <h3>{user?.name || 'Local User'}</h3>
              <p>{user?.email || 'No email associated'}</p>
              {user?.isLocal && (
                <span className="settings__account-badge">Local Account</span>
              )}
            </div>
          </div>
          <div className="settings__account-actions">
            {!user?.isLocal ? (
              <button className="settings__btn settings__btn--danger" onClick={onSignOut}>
                Sign Out
              </button>
            ) : (
              <button className="settings__btn settings__btn--primary" onClick={onSignInGoogle}>
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Storage Section */}
      <section className="settings__section">
        <h2 className="settings__section-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
          Cloud Storage
        </h2>
        <div className="settings__cloud-grid">
          {cloudProviders.map((provider) => (
            <div
              key={provider.id}
              className={`settings__cloud-card ${provider.connected ? 'connected' : ''}`}
            >
              <div className="settings__cloud-icon">
                <img src={provider.icon} alt={provider.name} />
              </div>
              <div className="settings__cloud-info">
                <h4>{provider.name}</h4>
                <span className="settings__cloud-status">
                  {provider.connected ? 'Connected' : 'Not connected'}
                </span>
              </div>
              <button
                className={`settings__btn ${provider.connected ? 'settings__btn--outline' : 'settings__btn--primary'}`}
                onClick={() => !provider.connected && onSignInGoogle?.(provider.status)}
                disabled={provider.connected}
              >
                {provider.connected ? 'Connected' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Backup Section */}
      <section className="settings__section">
        <h2 className="settings__section-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Backup Preferences
        </h2>
        <div className="settings__card">
          <div className="settings__toggle-row">
            <div className="settings__toggle-info">
              <h4>Auto-backup new photos</h4>
              <p>Automatically upload new photos to connected cloud storage</p>
            </div>
            <label className="settings__toggle">
              <input
                type="checkbox"
                checked={autoBackup}
                onChange={(e) => {
                  setAutoBackup(e.target.checked);
                  if (e.target.checked) setShowLocalWarning(true);
                }}
              />
              <span className="settings__toggle-slider" />
            </label>
          </div>
          {showLocalWarning && user?.isLocal && (
            <div className="settings__warning">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>Sign in with Google to enable cloud backup</span>
              <button onClick={() => setShowLocalWarning(false)}>Dismiss</button>
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section className="settings__section">
        <h2 className="settings__section-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          About
        </h2>
        <div className="settings__card">
          <div className="settings__about-row">
            <span>Version</span>
            <span className="settings__about-value">1.0.0</span>
          </div>
          <div className="settings__about-row">
            <span>Built with</span>
            <span className="settings__about-value">React + Cloudflare Workers</span>
          </div>
        </div>
      </section>
    </div>
  );
}