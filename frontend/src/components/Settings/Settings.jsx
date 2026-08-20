import { useState, useEffect } from 'react';
import { getAutoBackupPref, setAutoBackupPref } from '../../utils/preferences';
import { isGoogleAuthConfigured } from '../../config/googleAuth';
import './Settings.css';

export default function Settings({ user, storageConnections, onSignInGoogle, onContinueLocally, onSignOut }) {
  const [autoBackup, setAutoBackup] = useState(() => getAutoBackupPref());
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [exportMessage, setExportMessage] = useState('');

  const {
    connections = {},
    connecting = null,
    errors: connectionErrors = {},
    connect,
    disconnect,
    isOneDriveConfigured = false,
    isDropboxConfigured = false,
  } = storageConnections || {};

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const scope = user?.scope || '';
  const hasPhotosScope = scope.includes('photoslibrary');
  const hasDriveScope = scope.includes('drive.file');

  const handleAutoBackupChange = (e) => {
    const value = e.target.checked;
    setAutoBackup(value);
    setAutoBackupPref(value);
  };

  const handleExport = () => {
    const data = {
      settings: { autoBackup },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'picpocket-settings.json';
    link.click();
    URL.revokeObjectURL(url);
    setExportMessage('Settings exported successfully!');
    setTimeout(() => setExportMessage(''), 3000);
  };

  return (
    <div className="settings">
      <h1 className="settings__title">Settings</h1>

      {/* Account */}
      <section className="settings__section">
        <h2 className="settings__section-title">Account</h2>
        {user?.isLocal ? (
          <>
            <div className="settings__status-row">
              <span className="settings__label">
                <span className="settings__label-icon">💻</span>
                Using PicPocket locally on this device
              </span>
              <span className="settings__status settings__status--connected">✔ Active</span>
            </div>
            {isGoogleAuthConfigured() && (
              <>
                <p className="settings__hint">
                  Your photos stay right here either way — connecting Google just adds Drive/Photos backup.
                </p>
                <button className="settings__btn settings__btn--primary" onClick={onSignInGoogle}>
                  Connect Google Account
                </button>
              </>
            )}
          </>
        ) : (
          <>
            <div className="settings__status-row">
              <span className="settings__label">
                <span className="settings__label-icon">👤</span>
                Signed in with Google
                {user?.email && <span className="settings__account-name">{user.email}</span>}
              </span>
              <span className="settings__status settings__status--connected">✔ Active</span>
            </div>
            <p className="settings__hint">
              Your local library stays on this device even if you disconnect Google.
            </p>
            <button className="settings__btn" onClick={onContinueLocally}>
              Switch to Local-Only
            </button>
            <button className="settings__btn" onClick={onSignOut}>
              Sign Out
            </button>
          </>
        )}
      </section>

      {/* Google Connections */}
      <section className="settings__section">
        <h2 className="settings__section-title">Google Backup</h2>
        <p className="settings__description">Access your Google photos and Drive storage.</p>

        <div className="settings__status-row">
          <span className="settings__label">
            <span className="settings__label-icon">📷</span>
            Google Photos
          </span>
          {hasPhotosScope ? (
            <span className="settings__status settings__status--connected">✔ Connected</span>
          ) : (
            <span className="settings__status settings__status--warning">Not connected</span>
          )}
        </div>

        <div className="settings__status-row">
          <span className="settings__label">
            <span className="settings__label-icon">💾</span>
            Google Drive
          </span>
          {hasDriveScope ? (
            <span className="settings__status settings__status--connected">✔ Connected</span>
          ) : (
            <span className="settings__status settings__status--warning">Not connected</span>
          )}
        </div>
      </section>

      {/* Extra Cloud Storage */}
      <section className="settings__section">
        <h2 className="settings__section-title">Extra Cloud Storage</h2>
        <p className="settings__description">Connect additional cloud accounts for backup and importing photos from other devices.</p>

        <div className="settings__cloud-grid">
          <div className="settings__cloud-card">
            <div className="settings__cloud-icon">🟦</div>
            <div className="settings__cloud-info">
              <span className="settings__cloud-name">OneDrive</span>
              {connections.onedrive ? (
                <span className="settings__account-name">{connections.onedrive.accountName}</span>
              ) : (
                <span className="settings__cloud-status">Not connected</span>
              )}
            </div>
            {connections.onedrive ? (
              <button className="settings__btn settings__btn--sm" onClick={() => disconnect('onedrive')}>
                Disconnect
              </button>
            ) : !isOneDriveConfigured ? (
              <span className="settings__status settings__status--warning">⚙️ Set up in Settings</span>
            ) : (
              <button
                className="settings__btn settings__btn--primary settings__btn--sm"
                onClick={() => connect('onedrive')}
                disabled={connecting === 'onedrive'}
              >
                {connecting === 'onedrive' ? 'Connecting…' : 'Sign In'}
              </button>
            )}
          </div>
          {connectionErrors.onedrive && <p className="settings__connect-error">⚠️ {connectionErrors.onedrive}</p>}

          <div className="settings__cloud-card">
            <div className="settings__cloud-icon">🔵</div>
            <div className="settings__cloud-info">
              <span className="settings__cloud-name">Dropbox</span>
              {connections.dropbox ? (
                <span className="settings__account-name">{connections.dropbox.accountName}</span>
              ) : (
                <span className="settings__cloud-status">Not connected</span>
              )}
            </div>
            {connections.dropbox ? (
              <button className="settings__btn settings__btn--sm" onClick={() => disconnect('dropbox')}>
                Disconnect
              </button>
            ) : !isDropboxConfigured ? (
              <span className="settings__status settings__status--warning">⚙️ Set up in Settings</span>
            ) : (
              <button
                className="settings__btn settings__btn--primary settings__btn--sm"
                onClick={() => connect('dropbox')}
                disabled={connecting === 'dropbox'}
              >
                {connecting === 'dropbox' ? 'Connecting…' : 'Sign In'}
              </button>
            )}
          </div>
          {connectionErrors.dropbox && <p className="settings__connect-error">⚠️ {connectionErrors.dropbox}</p>}
        </div>
      </section>

      {/* Backup & Sync */}
      <section className="settings__section">
        <h2 className="settings__section-title">Backup &amp; Sync</h2>

        <label className="settings__checkbox-row">
          <input
            type="checkbox"
            id="auto-backup"
            className="settings__checkbox-input"
            checked={autoBackup}
            onChange={handleAutoBackupChange}
          />
          <span className="settings__label">
            <span className="settings__label-icon">🔄</span>
            Auto-Backup Photos
          </span>
        </label>
        <p className="settings__hint">Automatically back up new photos to connected cloud services.</p>

        <div className="settings__status-row">
          <span className="settings__label">
            <span className="settings__label-icon">📡</span>
            Network
          </span>
          {isOnline ? (
            <span className="settings__status settings__status--connected">✔ Online</span>
          ) : (
            <span className="settings__status settings__status--warning">⚠ Offline</span>
          )}
        </div>
      </section>

      {/* Data Export */}
      <section className="settings__section">
        <h2 className="settings__section-title">Data</h2>
        <p className="settings__description">
          Export your PicPocket settings as a JSON file.
        </p>
        <button className="settings__btn settings__btn--primary" onClick={handleExport}>
          📤 Export Data
        </button>
        {exportMessage && <p className="settings__status settings__status--connected">{exportMessage}</p>}
      </section>
    </div>
  );
}