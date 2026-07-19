import { useState } from 'react';
import './Settings.css';

const DEFAULT_HORSE_PROFILE = { id: Date.now(), name: '', breed: '', birthYear: '' };

export default function Settings() {
  const [googlePhotos, setGooglePhotos] = useState(false);
  const [googleDrive, setGoogleDrive] = useState(false);
  const [autoBackup, setAutoBackup] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [horseProfiles, setHorseProfiles] = useState([]);
  const [newHorse, setNewHorse] = useState({ ...DEFAULT_HORSE_PROFILE });
  const [editingId, setEditingId] = useState(null);
  const [exportMessage, setExportMessage] = useState('');

  // --- Toggles ---
  const handleToggle = (setter) => (e) => setter(e.target.checked);

  // --- Horse profile management ---
  const handleHorseChange = (field, value) => {
    setNewHorse((prev) => ({ ...prev, [field]: value }));
  };

  const addHorse = () => {
    if (!newHorse.name.trim()) return;
    if (editingId !== null) {
      setHorseProfiles((prev) =>
        prev.map((h) => (h.id === editingId ? { ...newHorse, id: editingId } : h))
      );
      setEditingId(null);
    } else {
      setHorseProfiles((prev) => [...prev, { ...newHorse, id: Date.now() }]);
    }
    setNewHorse({ ...DEFAULT_HORSE_PROFILE, id: Date.now() });
  };

  const editHorse = (horse) => {
    setNewHorse({ ...horse });
    setEditingId(horse.id);
  };

  const deleteHorse = (id) => {
    setHorseProfiles((prev) => prev.filter((h) => h.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setNewHorse({ ...DEFAULT_HORSE_PROFILE, id: Date.now() });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewHorse({ ...DEFAULT_HORSE_PROFILE, id: Date.now() });
  };

  // --- Data export ---
  const handleExport = () => {
    const data = {
      settings: { googlePhotos, googleDrive, autoBackup, offlineMode },
      horseProfiles,
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

        <label className="settings__toggle-row">
          <span className="settings__label">
            <span className="settings__label-icon">📷</span>
            Google Photos
          </span>
          <div className="settings__toggle-wrap">
            <input
              type="checkbox"
              role="switch"
              id="google-photos"
              className="settings__toggle-input"
              checked={googlePhotos}
              onChange={handleToggle(setGooglePhotos)}
            />
            <span className="settings__toggle-track" aria-hidden="true" />
          </div>
        </label>
        {googlePhotos && (
          <p className="settings__status settings__status--connected">✔ Connected to Google Photos</p>
        )}

        <label className="settings__toggle-row">
          <span className="settings__label">
            <span className="settings__label-icon">💾</span>
            Google Drive
          </span>
          <div className="settings__toggle-wrap">
            <input
              type="checkbox"
              role="switch"
              id="google-drive"
              className="settings__toggle-input"
              checked={googleDrive}
              onChange={handleToggle(setGoogleDrive)}
            />
            <span className="settings__toggle-track" aria-hidden="true" />
          </div>
        </label>
        {googleDrive && (
          <p className="settings__status settings__status--connected">✔ Connected to Google Drive</p>
        )}
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
            onChange={handleToggle(setAutoBackup)}
          />
          <span className="settings__label">
            <span className="settings__label-icon">🔄</span>
            Auto-Backup Photos
          </span>
        </label>

        <label className="settings__toggle-row">
          <span className="settings__label">
            <span className="settings__label-icon">📡</span>
            Offline Mode
          </span>
          <div className="settings__toggle-wrap">
            <input
              type="checkbox"
              role="switch"
              id="offline-mode"
              className="settings__toggle-input"
              checked={offlineMode}
              onChange={handleToggle(setOfflineMode)}
            />
            <span className="settings__toggle-track" aria-hidden="true" />
          </div>
        </label>
        {offlineMode && (
          <p className="settings__status settings__status--warning">⚠ Offline mode enabled — sync is paused</p>
        )}
      </section>

      {/* Horse Profiles */}
      <section className="settings__section">
        <h2 className="settings__section-title">🐴 Horse Profiles</h2>

        {horseProfiles.length > 0 && (
          <ul className="settings__horse-list">
            {horseProfiles.map((horse) => (
              <li key={horse.id} className="settings__horse-item">
                <div className="settings__horse-info">
                  <strong>{horse.name}</strong>
                  {horse.breed && <span className="settings__horse-meta">{horse.breed}</span>}
                  {horse.birthYear && (
                    <span className="settings__horse-meta">b. {horse.birthYear}</span>
                  )}
                </div>
                <div className="settings__horse-actions">
                  <button className="settings__btn settings__btn--sm" onClick={() => editHorse(horse)}>
                    Edit
                  </button>
                  <button
                    className="settings__btn settings__btn--sm settings__btn--danger"
                    onClick={() => deleteHorse(horse.id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="settings__horse-form">
          <h3 className="settings__horse-form-title">
            {editingId !== null ? 'Edit Horse' : 'Add Horse'}
          </h3>
          <div className="settings__form-fields">
            <input
              type="text"
              placeholder="Name *"
              value={newHorse.name}
              onChange={(e) => handleHorseChange('name', e.target.value)}
              className="settings__input"
            />
            <input
              type="text"
              placeholder="Breed"
              value={newHorse.breed}
              onChange={(e) => handleHorseChange('breed', e.target.value)}
              className="settings__input"
            />
            <input
              type="number"
              placeholder="Birth Year"
              value={newHorse.birthYear}
              onChange={(e) => handleHorseChange('birthYear', e.target.value)}
              className="settings__input settings__input--sm"
              min="1900"
              max={new Date().getFullYear()}
            />
          </div>
          <div className="settings__form-actions">
            <button
              className="settings__btn settings__btn--primary"
              onClick={addHorse}
              disabled={!newHorse.name.trim()}
            >
              {editingId !== null ? 'Save Changes' : 'Add Horse'}
            </button>
            {editingId !== null && (
              <button className="settings__btn" onClick={cancelEdit}>
                Cancel
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Data Export */}
      <section className="settings__section">
        <h2 className="settings__section-title">Data</h2>
        <p className="settings__description">
          Export your PicPocket settings and horse profiles as a JSON file.
        </p>
        <button className="settings__btn settings__btn--primary" onClick={handleExport}>
          📤 Export Data
        </button>
        {exportMessage && <p className="settings__status settings__status--connected">{exportMessage}</p>}
      </section>
    </div>
  );
}
