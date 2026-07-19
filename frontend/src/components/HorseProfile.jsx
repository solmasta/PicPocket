import React, { useState, useRef } from 'react';

const BREEDS = [
  'Arabian', 'Thoroughbred', 'Quarter Horse', 'Mustang', 'Appaloosa',
  'Paint Horse', 'Friesian', 'Clydesdale', 'Warmblood', 'Morgan', 'Other',
];

const COAT_COLORS = [
  'Bay', 'Black', 'Chestnut', 'Gray', 'Palomino', 'Roan',
  'Dun', 'Buckskin', 'Cremello', 'Pinto', 'Other',
];

export default function HorseProfile() {
  const [profile, setProfile] = useState({
    name: '',
    breed: '',
    coatColor: '',
    age: '',
    owner: '',
    bio: '',
  });
  const [avatarSrc, setAvatarSrc] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [saved, setSaved] = useState(false);
  const avatarInputRef = useRef(null);
  const photoInputRef = useRef(null);

  const handleChange = (field) => (e) => {
    setProfile((prev) => ({ ...prev, [field]: e.target.value }));
    setSaved(false);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarSrc(URL.createObjectURL(file));
    setSaved(false);
  };

  const handlePhotosChange = (e) => {
    const files = Array.from(e.target.files);
    const urls = files.map((f) => URL.createObjectURL(f));
    setPhotos((prev) => [...prev, ...urls]);
    setSaved(false);
  };

  const handleRemovePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setSaved(false);
  };

  const handleSave = () => {
    if (!profile.name.trim()) {
      alert("Please enter the horse's name before saving.");
      return;
    }
    setSaved(true);
  };

  const fieldStyle = {
    display: 'block', marginTop: 4, width: '100%',
    padding: '8px 10px', border: '1px solid #d1d5db',
    borderRadius: 6, fontSize: 14,
  };

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 24, fontFamily: 'sans-serif' }}>
      <h2 style={{ marginBottom: 20 }}>🐴 Horse Profile</h2>

      {/* Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div
          onClick={() => avatarInputRef.current && avatarInputRef.current.click()}
          style={{
            width: 90, height: 90, borderRadius: '50%',
            background: '#f3f4f6', border: '2px dashed #a5b4fc',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', overflow: 'hidden', flexShrink: 0,
          }}
        >
          {avatarSrc
            ? <img src={avatarSrc} alt="Horse avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 32 }}>🐴</span>
          }
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>Profile Photo</p>
          <button
            onClick={() => avatarInputRef.current && avatarInputRef.current.click()}
            style={{
              marginTop: 6, padding: '5px 12px',
              background: '#6366f1', color: '#fff',
              border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13,
            }}
          >
            {avatarSrc ? 'Change' : 'Upload'}
          </button>
        </div>
        <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
      </div>

      {/* Fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', marginBottom: 14 }}>
        <label style={{ gridColumn: '1 / -1' }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Name *</span>
          <input type="text" placeholder="e.g. Thunderbolt" value={profile.name} onChange={handleChange('name')} style={fieldStyle} />
        </label>

        <label>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Breed</span>
          <select value={profile.breed} onChange={handleChange('breed')} style={fieldStyle}>
            <option value="">Select breed…</option>
            {BREEDS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </label>

        <label>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Coat Color</span>
          <select value={profile.coatColor} onChange={handleChange('coatColor')} style={fieldStyle}>
            <option value="">Select color…</option>
            {COAT_COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>

        <label>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Age (years)</span>
          <input type="number" min={0} max={50} placeholder="e.g. 5" value={profile.age} onChange={handleChange('age')} style={fieldStyle} />
        </label>

        <label>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Owner</span>
          <input type="text" placeholder="Owner name" value={profile.owner} onChange={handleChange('owner')} style={fieldStyle} />
        </label>

        <label style={{ gridColumn: '1 / -1' }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Bio</span>
          <textarea
            rows={3}
            placeholder="Tell us about this horse…"
            value={profile.bio}
            onChange={handleChange('bio')}
            style={{ ...fieldStyle, resize: 'vertical' }}
          />
        </label>
      </div>

      {/* Photo Gallery */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Photo Gallery</span>
          <button
            onClick={() => photoInputRef.current && photoInputRef.current.click()}
            style={{
              padding: '4px 10px', background: '#fff',
              border: '1.5px solid #6366f1', color: '#6366f1',
              borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600,
            }}
          >
            + Add Photos
          </button>
        </div>
        {photos.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {photos.map((src, i) => (
              <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 6, overflow: 'hidden', background: '#e5e7eb' }}>
                <img src={src} alt={`Gallery ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  aria-label="Remove photo"
                  onClick={() => handleRemovePhoto(i)}
                  style={{
                    position: 'absolute', top: 2, right: 2,
                    background: 'rgba(0,0,0,0.55)', color: '#fff',
                    border: 'none', borderRadius: '50%',
                    width: 20, height: 20, fontSize: 12, cursor: 'pointer', lineHeight: '20px', padding: 0,
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#9ca3af', fontSize: 13, margin: 0 }}>No photos yet.</p>
        )}
        <input ref={photoInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handlePhotosChange} />
      </div>

      <button
        onClick={handleSave}
        style={{
          width: '100%', padding: '10px 0',
          background: saved ? '#22c55e' : '#6366f1',
          color: '#fff', border: 'none', borderRadius: 8,
          fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s',
        }}
      >
        {saved ? '✓ Profile Saved' : 'Save Profile'}
      </button>
    </div>
  );
}
