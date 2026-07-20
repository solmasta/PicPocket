import { useState, useEffect } from 'react';
import { getAutoBackupPref, setAutoBackupPref } from '../../utils/preferences';
import './Settings.css';

export default function Settings({ user }) {
  const [autoBackup, setAutoBackup] = useState(() => getAutoBackupPref());
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [exportMessage, setExportMessage] = useState('');

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

      {/* Connections */}
      <section className="settings__section">
        <h2 className="settings__section-title">Connections</h2>
        <p className="settings__description">Google account permissions granted during sign-in.</p>

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
