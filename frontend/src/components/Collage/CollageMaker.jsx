import React, { useState, useRef } from 'react';
import './CollageMaker.css';

const LAYOUTS = [
  { id: '2x1', label: '2 columns', cols: 2, rows: 1, slots: 2 },
  { id: '3x1', label: '3 columns', cols: 3, rows: 1, slots: 3 },
  { id: '2x2', label: '2x2 grid', cols: 2, rows: 2, slots: 4 },
  { id: '3x2', label: '3x2 grid', cols: 3, rows: 2, slots: 6 },
  { id: 'feature-left', label: 'Feature Left', cols: 3, rows: 2, slots: 3, custom: 'feature-left' },
  { id: 'feature-right', label: 'Feature Right', cols: 3, rows: 2, slots: 3, custom: 'feature-right' },
];

function CollageMaker({ photos }) {
  const [selectedLayout, setSelectedLayout] = useState(LAYOUTS[3]);
  const [slots, setSlots] = useState({});
  const [collageTitle, setCollageTitle] = useState('My Collage');
  const canvasRef = useRef(null);

  const assignPhoto = (slotIndex, photo) => {
    setSlots((prev) => ({ ...prev, [slotIndex]: photo }));
  };

  const clearSlot = (slotIndex) => {
    setSlots((prev) => {
      const next = { ...prev };
      delete next[slotIndex];
      return next;
    });
  };

  const downloadCollage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${collageTitle.replace(/\s+/g, '-')}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.92);
    link.click();
  };

  const renderSlot = (index) => {
    const photo = slots[index];
    return (
      <div key={index} className="collage-slot">
        {photo ? (
          <>
            <img src={photo.dataUrl} alt={photo.fileName} className="slot-image" />
            <button
              className="slot-remove"
              onClick={() => clearSlot(index)}
              aria-label="Remove photo from slot"
            >
              ✕
            </button>
          </>
        ) : (
          <div className="slot-placeholder">
            <span>+</span>
            <span>Add Photo</span>
          </div>
        )}
      </div>
    );
  };

  const filledSlots = Object.keys(slots).length;
  const totalSlots = selectedLayout.slots;

  return (
    <div className="collage-maker">
      <h2>Collage Maker</h2>

      <div className="collage-layout">
        {/* Config panel */}
        <div className="collage-config">
          <div className="config-section">
            <label className="config-label" htmlFor="collage-title">
              Collage Title
            </label>
            <input
              id="collage-title"
              type="text"
              className="collage-title-input"
              value={collageTitle}
              onChange={(e) => setCollageTitle(e.target.value)}
              placeholder="My Collage"
            />
          </div>

          <div className="config-section">
            <label className="config-label">Layout</label>
            <div className="layout-options">
              {LAYOUTS.map((layout) => (
                <button
                  key={layout.id}
                  className={`layout-btn ${selectedLayout.id === layout.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedLayout(layout);
                    setSlots({});
                  }}
                >
                  <div className="layout-preview" data-layout={layout.id}>
                    {Array.from({ length: layout.slots }).map((_, i) => (
                      <div key={i} className="layout-preview-cell" />
                    ))}
                  </div>
                  <span>{layout.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="config-section">
            <label className="config-label">Photo Library</label>
            <p className="config-hint">Click a photo to add it to the next empty slot</p>
            <div className="photo-picker">
              {photos.length === 0 ? (
                <p className="no-photos-hint">No photos available. Upload some first!</p>
              ) : (
                photos.map((photo) => (
                  <img
                    key={photo.id}
                    src={photo.thumbnail || photo.dataUrl}
                    alt={photo.fileName}
                    className="picker-photo"
                    title={photo.fileName}
                    onClick={() => {
                      const nextEmpty = Array.from(
                        { length: selectedLayout.slots },
                        (_, i) => i
                      ).find((i) => !slots[i]);
                      if (nextEmpty !== undefined) {
                        assignPhoto(nextEmpty, photo);
                      }
                    }}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Collage canvas */}
        <div className="collage-canvas-wrap">
          <div className="collage-title-display">{collageTitle}</div>
          <div
            className="collage-canvas"
            data-layout={selectedLayout.id}
            style={{
              '--cols': selectedLayout.cols,
              '--rows': selectedLayout.rows,
            }}
          >
            {Array.from({ length: selectedLayout.slots }).map((_, i) => renderSlot(i))}
          </div>
          <div className="collage-progress">
            {filledSlots} / {totalSlots} photos added
          </div>
          <div className="collage-actions">
            <button
              className="download-btn"
              onClick={downloadCollage}
              disabled={filledSlots === 0}
            >
              ⬇️ Download Collage
            </button>
            <button
              className="clear-btn"
              onClick={() => setSlots({})}
              disabled={filledSlots === 0}
            >
              Clear All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CollageMaker;
