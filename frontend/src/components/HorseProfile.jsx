import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getHorseProfile, saveHorseProfile } from '../utils/indexedDB';
import { resizeImage } from '../utils/imageFilters';
import './HorseProfile.css';

const BREEDS = [
  'Arabian', 'Thoroughbred', 'Quarter Horse', 'Mustang', 'Appaloosa',
  'Paint Horse', 'Friesian', 'Clydesdale', 'Warmblood', 'Morgan', 'Other',
];

const COAT_COLORS = [
  'Bay', 'Black', 'Chestnut', 'Gray', 'Palomino', 'Roan',
  'Dun', 'Buckskin', 'Cremello', 'Pinto', 'Other',
];

const EMPTY_PROFILE = {
  name: '',
  breed: '',
  coatColor: '',
  age: '',
  owner: '',
  bio: '',
};

export default function HorseProfile({ user }) {
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [avatarSrc, setAvatarSrc] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const avatarInputRef = useRef(null);
  const photoInputRef = useRef(null);

  // Load any previously saved profile for this user from IndexedDB.
  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const stored = await getHorseProfile(user.id);
        if (!cancelled && stored) {
          setProfile({ ...EMPTY_PROFILE, ...stored.fields });
          setAvatarSrc(stored.avatar || null);
          setPhotos(stored.photos || []);
        }
      } catch (err) {
        console.error('Failed to load horse profile:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleChange = (field) => (e) => {
    setProfile((prev) => ({ ...prev, [field]: e.target.value }));
    setSaved(false);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImage(file, 400, 400, 0.85);
      setAvatarSrc(dataUrl);
      setSaved(false);
    } catch (err) {
      console.error('Failed to process avatar image:', err);
    }
  };

  const handlePhotosChange = async (e) => {
    const files = Array.from(e.target.files);
    try {
      const dataUrls = await Promise.all(files.map((f) => resizeImage(f, 1024, 1024, 0.85)));
      setPhotos((prev) => [...prev, ...dataUrls]);
      setSaved(false);
    } catch (err) {
      console.error('Failed to process gallery photos:', err);
    }
  };

  const handleRemovePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setSaved(false);
  };

  const handleSave = useCallback(async () => {
    if (!profile.name.trim()) {
      alert("Please enter the horse's name before saving.");
      return;
    }
    if (!user) return;

    try {
      await saveHorseProfile({
        userId: user.id,
        fields: profile,
        avatar: avatarSrc,
        photos,
        updatedAt: new Date().toISOString(),
      });
      setSaved(true);
    } catch (err) {
      console.error('Failed to save horse profile:', err);
      alert('Something went wrong saving the profile. Please try again.');
    }
  }, [profile, avatarSrc, photos, user]);

  const fieldStyle = {
    display: 'block', marginTop: 4, width: '100%',
    padding: '8px 10px', border: '1px solid #d1d5db',
    borderRadius: 6, fontSize: 14,
  };

  if (loading) {
    return (
      <div className="horse-profile-container">
        <div className="horse-profile-loading">Loading horse profile…</div>
      </div>
    );
  }

  return (
    <div className="horse-profile-container">
      <div className="horse-profile-card">
        <h2 className="horse-profile-title">🐴 Horse Profile</h2>

        {/* Avatar */}
        <div className="horse-avatar-section">
          <div
            onClick={() => avatarInputRef.current && avatarInputRef.current.click()}
            className="horse-avatar-container"
          >
            {avatarSrc
              ? <img src={avatarSrc} alt="Horse avatar" className="horse-avatar-image" />
              : <span className="horse-avatar-placeholder">🐴</span>
            }
          </div>
          <div className="horse-avatar-controls">
            <p className="horse-avatar-label">Profile Photo</p>
            <button
              onClick={() => avatarInputRef.current && avatarInputRef.current.click()}
              className="horse-avatar-button"
            >
              {avatarSrc ? 'Change' : 'Upload'}
            </button>
          </div>
          <input 
            ref={avatarInputRef} 
            type="file" 
            accept="image/*" 
            className="horse-avatar-input" 
            onChange={handleAvatarChange} 
          />
        </div>

        {/* Fields */}
        <div className="horse-profile-form">
          <div className="form-field full-width">
            <label className="form-label">
              Name <span className="required">*</span>
            </label>
            <input 
              type="text" 
              placeholder="e.g. Thunderbolt" 
              value={profile.name} 
              onChange={handleChange('name')} 
              className="form-input"
            />
          </div>

          <div className="form-field">
            <label className="form-label">Breed</label>
            <select 
              value={profile.breed} 
              onChange={handleChange('breed')} 
              className="form-select"
            >
              <option value="">Select breed…</option>
              {BREEDS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div className="form-field">
            <label className="form-label">Coat Color</label>
            <select 
              value={profile.coatColor} 
              onChange={handleChange('coatColor')} 
              className="form-select"
            >
              <option value="">Select color…</option>
              {COAT_COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="form-field">
            <label className="form-label">Age (years)</label>
            <input 
              type="number" 
              min={0} 
              max={50} 
              placeholder="e.g. 5" 
              value={profile.age} 
              onChange={handleChange('age')} 
              className="form-input"
            />
          </div>

          <div className="form-field">
            <label className="form-label">Owner</label>
            <input 
              type="text" 
              placeholder="Owner name" 
              value={profile.owner} 
              onChange={handleChange('owner')} 
              className="form-input"
            />
          </div>

          <div className="form-field full-width">
            <label className="form-label">Bio</label>
            <textarea
              rows={3}
              placeholder="Tell us about this horse…"
              value={profile.bio}
              onChange={handleChange('bio')}
              className="form-textarea"
            />
          </div>
        </div>

        {/* Photo Gallery */}
        <div className="horse-gallery-section">
          <div className="horse-gallery-header">
            <span className="horse-gallery-title">Photo Gallery</span>
            <button
              onClick={() => photoInputRef.current && photoInputRef.current.click()}
              className="horse-gallery-add-button"
            >
              + Add Photos
            </button>
          </div>
          {photos.length > 0 ? (
            <div className="horse-gallery-grid">
              {photos.map((src, i) => (
                <div key={i} className="horse-gallery-item">
                  <img src={src} alt={`Gallery ${i + 1}`} className="horse-gallery-image" />
                  <button
                    aria-label="Remove photo"
                    onClick={() => handleRemovePhoto(i)}
                    className="horse-gallery-remove"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="horse-gallery-empty">No photos yet.</p>
          )}
          <input 
            ref={photoInputRef} 
            type="file" 
            accept="image/*" 
            multiple 
            className="horse-gallery-input" 
            onChange={handlePhotosChange} 
          />
        </div>

        <button
          onClick={handleSave}
          className={`horse-save-button ${saved ? 'saved' : ''}`}
        >
          {saved ? '✓ Profile Saved' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}