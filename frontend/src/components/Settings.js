import { useState } from 'react';
import './Settings.css';

function Settings() {
  const [settings, setSettings] = useState({
    googlePhotos: false,
    googleDrive: false,
    autoBackup: false,
    horseProfile: {}
  });

  const [horseName, setHorseName] = useState('');
  const [horseBreed, setHorseBreed] = useState('');

  const toggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const saveHorseProfile = () => {
    if (!horseName.trim()) return;
    setSettings((prev) => ({
      ...prev,
      horseProfile: { name: horseName.trim(), breed: horseBreed.trim() }
    }));
  };

  const { googlePhotos, googleDrive, autoBackup, horseProfile } = settings;

  return (
    <div className="settings">
      <h2>Settings</h2>

      <section className="settings-section">
        <h3>Integrations</h3>

        <div className="settings-row">
          <label htmlFor="googlePhotos">Google Photos</label>
          <input
            id="googlePhotos"
            type="checkbox"
            checked={googlePhotos}
            onChange={() => toggle('googlePhotos')}
          />
        </div>

        <div className="settings-row">
          <label htmlFor="googleDrive">Google Drive</label>
          <input
            id="googleDrive"
            type="checkbox"
            checked={googleDrive}
            onChange={() => toggle('googleDrive')}
          />
        </div>

        <div className="settings-row">
          <label htmlFor="autoBackup">Auto Backup</label>
          <input
            id="autoBackup"
            type="checkbox"
            checked={autoBackup}
            onChange={() => toggle('autoBackup')}
            disabled={!googlePhotos && !googleDrive}
          />
          {!googlePhotos && !googleDrive && (
            <span className="settings-hint">Enable Google Photos or Drive first</span>
          )}
        </div>
      </section>

      <section className="settings-section">
        <h3>Horse Profile</h3>

        {horseProfile.name && (
          <div className="horse-profile-display">
            <p>
              <strong>Name:</strong> {horseProfile.name}
            </p>
            {horseProfile.breed && (
              <p>
                <strong>Breed:</strong> {horseProfile.breed}
              </p>
            )}
          </div>
        )}

        <div className="settings-row">
          <label htmlFor="horseName">Name</label>
          <input
            id="horseName"
            type="text"
            value={horseName}
            onChange={(e) => setHorseName(e.target.value)}
            placeholder="Enter horse name"
          />
        </div>

        <div className="settings-row">
          <label htmlFor="horseBreed">Breed</label>
          <input
            id="horseBreed"
            type="text"
            value={horseBreed}
            onChange={(e) => setHorseBreed(e.target.value)}
            placeholder="Enter horse breed"
          />
        </div>

        <button
          className="settings-save-btn"
          onClick={saveHorseProfile}
          disabled={!horseName.trim()}
        >
          Save Horse Profile
        </button>
      </section>
    </div>
  );
}

export default Settings;
