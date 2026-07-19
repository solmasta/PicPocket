import React, { useState, useRef, useEffect } from 'react';

const FILTERS = [
  { id: 'none',        label: 'Original',  css: 'none' },
  { id: 'grayscale',   label: 'B&W',       css: 'grayscale(100%)' },
  { id: 'sepia',       label: 'Sepia',     css: 'sepia(80%)' },
  { id: 'vivid',       label: 'Vivid',     css: 'saturate(200%) contrast(110%)' },
  { id: 'cool',        label: 'Cool',      css: 'hue-rotate(200deg) saturate(120%)' },
  { id: 'warm',        label: 'Warm',      css: 'hue-rotate(-20deg) saturate(130%)' },
  { id: 'fade',        label: 'Fade',      css: 'opacity(70%) brightness(110%)' },
  { id: 'dramatic',    label: 'Dramatic',  css: 'contrast(150%) brightness(90%)' },
];

const SWATCH_SIZE = 56;

function FilterSwatch({ filter, isSelected, previewSrc, onClick }) {
  return (
    <button
      onClick={onClick}
      title={filter.label}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        background: 'none', border: 'none', cursor: 'pointer', padding: 4,
      }}
    >
      <div
        style={{
          width: SWATCH_SIZE, height: SWATCH_SIZE,
          borderRadius: 8,
          border: isSelected ? '3px solid #6366f1' : '2px solid #e5e7eb',
          overflow: 'hidden',
          background: '#e5e7eb',
        }}
      >
        {previewSrc && (
          <img
            src={previewSrc}
            alt={filter.label}
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: filter.css }}
          />
        )}
      </div>
      <span style={{ fontSize: 11, color: isSelected ? '#6366f1' : '#374151', fontWeight: isSelected ? 700 : 400 }}>
        {filter.label}
      </span>
    </button>
  );
}

export default function PhotoFilters() {
  const [imageSrc, setImageSrc] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState(FILTERS[0]);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const canvasRef = useRef(null);
  const inputRef = useRef(null);

  const combinedFilter = [
    selectedFilter.css !== 'none' ? selectedFilter.css : '',
    `brightness(${brightness}%)`,
    `contrast(${contrast}%)`,
  ]
    .filter(Boolean)
    .join(' ');

  useEffect(() => {
    if (!imageSrc || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.filter = combinedFilter;
      ctx.drawImage(img, 0, 0);
    };
    img.src = imageSrc;
  }, [imageSrc, combinedFilter]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    setSelectedFilter(FILTERS[0]);
    setBrightness(100);
    setContrast(100);
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'filtered-photo.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 24, fontFamily: 'sans-serif' }}>
      <h2 style={{ marginBottom: 16 }}>Photo Filters</h2>

      {!imageSrc ? (
        <div
          onClick={() => inputRef.current && inputRef.current.click()}
          style={{
            border: '2px dashed #a5b4fc', borderRadius: 12, padding: 48,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 12, cursor: 'pointer', background: '#f5f3ff',
          }}
        >
          <span style={{ fontSize: 40 }}>🖼️</span>
          <span style={{ color: '#6366f1', fontWeight: 600 }}>Upload a photo to get started</span>
        </div>
      ) : (
        <>
          <div style={{ position: 'relative', marginBottom: 16, borderRadius: 10, overflow: 'hidden', background: '#000' }}>
            <img
              src={imageSrc}
              alt="Preview"
              style={{ width: '100%', display: 'block', filter: combinedFilter }}
            />
          </div>

          <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 8, marginBottom: 16 }}>
            {FILTERS.map((f) => (
              <FilterSwatch
                key={f.id}
                filter={f}
                isSelected={selectedFilter.id === f.id}
                previewSrc={imageSrc}
                onClick={() => setSelectedFilter(f)}
              />
            ))}
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
              Brightness <span>{brightness}%</span>
            </label>
            <input
              type="range" min={50} max={200} value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
              Contrast <span>{contrast}%</span>
            </label>
            <input
              type="range" min={50} max={200} value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => inputRef.current && inputRef.current.click()}
              style={{
                flex: 1, padding: '10px 0',
                background: '#fff', color: '#6366f1',
                border: '1.5px solid #6366f1', borderRadius: 8,
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Change Photo
            </button>
            <button
              onClick={handleDownload}
              style={{
                flex: 1, padding: '10px 0',
                background: '#6366f1', color: '#fff',
                border: 'none', borderRadius: 8,
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Download
            </button>
          </div>
        </>
      )}

      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
