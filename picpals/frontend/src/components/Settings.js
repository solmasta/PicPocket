import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Settings({ user, onLogout }) {
  const navigate = useNavigate();
  const [autoBackup, setAutoBackup] = useState(true);
  const [syncGooglePhotos, setSyncGooglePhotos] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + user.token,
        },
        body: JSON.stringify({ autoBackup, syncGooglePhotos }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  return (
    <div className="settings">
      <h2>Settings</h2>

      <div className="setting-row">
        <label htmlFor="auto-backup">Auto-backup to Google Drive</label>
        <input
          id="auto-backup"
          type="checkbox"
          checked={autoBackup}
          onChange={(e) => setAutoBackup(e.target.checked)}
        />
      </div>

      <div className="setting-row">
        <label htmlFor="sync-google-photos">Sync with Google Photos</label>
        <input
          id="sync-google-photos"
          type="checkbox"
          checked={syncGooglePhotos}
          onChange={(e) => setSyncGooglePhotos(e.target.checked)}
        />
      </div>

      <button onClick={handleSave}>Save Settings</button>
      {saved && <p>Settings saved!</p>}

      <hr />

      <div className="account-section">
        <p>Signed in as {user.email}</p>
        <button onClick={handleLogout}>Sign Out</button>
      </div>
    </div>
  );
}

export default Settings;
