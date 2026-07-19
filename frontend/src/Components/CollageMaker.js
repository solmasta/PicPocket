import React, { useState, useRef } from 'react';

const LAYOUTS = [
  { id: 'grid2x2', label: '2×2 Grid', slots: 4, style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' } },
  { id: 'grid3x3', label: '3×3 Grid', slots: 9, style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' } },
  { id: 'strip',   label: 'Strip',    slots: 3, style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' } },
];

function PhotoSlot({ photo, index, onSelect, onRemove }) {
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onSelect(index, url);
  };

  return (
    <div
      style={{
        position: 'relative',
        backgroundColor: '#e5e7eb',
        cursor: 'pointer',
        aspectRatio: '1',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={() => !photo && inputRef.current && inputRef.current.click()}
    >
      {photo ? (
        <>
          <img src={photo} alt={`Collage slot ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <button
            aria-label="Remove photo"
            onClick={(e) => { e.stopPropagation(); onRemove(index); }}
            style={{
              position: 'absolute', top: 4, right: 4,
              background: 'rgba(0,0,0,0.5)', color: '#fff',
              border: 'none', borderRadius: '50%',
              width: 24, height: 24, cursor: 'pointer', fontSize: 14,
            }}
          >
            ×
          </button>
        </>
      ) : (
        <span style={{ color: '#9ca3af', fontSize: 28 }}>＋</span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  );
}

export default function CollageMaker() {
  const [layoutId, setLayoutId] = useState(LAYOUTS[0].id);
  const [photos, setPhotos] = useState([]);
  const [title, setTitle] = useState('');

  const layout = LAYOUTS.find((l) => l.id === layoutId);

  const handleSelect = (index, url) => {
    setPhotos((prev) => {
      const next = [...prev];
      next[index] = url;
      return next;
    });
  };

  const handleRemove = (index) => {
    setPhotos((prev) => {
      const next = [...prev];
      next[index] = undefined;
      return next;
    });
  };

  const handleLayoutChange = (id) => {
    setLayoutId(id);
    setPhotos([]);
  };

  const handleSave = () => {
    const filled = photos.filter(Boolean);
    if (filled.length === 0) {
      alert('Add at least one photo before saving.');
      return;
    }
    alert(`Collage "${title || 'Untitled'}" saved with ${filled.length} photo(s)!`);
  };

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 24, fontFamily: 'sans-serif' }}>
      <h2 style={{ marginBottom: 16 }}>Collage Maker</h2>

      <label style={{ display: 'block', marginBottom: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>Collage Title</span>
        <input
          type="text"
          placeholder="My Collage"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ display: 'block', marginTop: 4, width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6 }}
        />
      </label>

      <div style={{ marginBottom: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>Layout</span>
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          {LAYOUTS.map((l) => (
            <button
              key={l.id}
              onClick={() => handleLayoutChange(l.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                border: '1px solid',
                borderColor: layoutId === l.id ? '#6366f1' : '#d1d5db',
                background: layoutId === l.id ? '#6366f1' : '#fff',
                color: layoutId === l.id ? '#fff' : '#374151',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ ...layout.style, border: '2px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
        {Array.from({ length: layout.slots }).map((_, i) => (
          <PhotoSlot
            key={i}
            index={i}
            photo={photos[i]}
            onSelect={handleSelect}
            onRemove={handleRemove}
          />
        ))}
      </div>

      <button
        onClick={handleSave}
        style={{
          width: '100%', padding: '10px 0',
          background: '#6366f1', color: '#fff',
          border: 'none', borderRadius: 8,
          fontSize: 15, fontWeight: 600, cursor: 'pointer',
        }}
      >
        Save Collage
      </button>
    </div>
  );
}
