import React, { useState, useRef } from 'react';
import './PhotoGallery.css';

function PhotoGallery({ userEmail, onSignOut }) {
  const [photos, setPhotos] = useState([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  const addFiles = (files) => {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    const newPhotos = imageFiles.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      name: file.name,
      url: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...newPhotos]);
  };

  const handleFileChange = (e) => {
    addFiles(e.target.files);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const removePhoto = (id) => {
    setPhotos((prev) => {
      const removed = prev.find((p) => p.id === id);
      if (removed) URL.revokeObjectURL(removed.url);
      return prev.filter((p) => p.id !== id);
    });
  };

  return (
    <div className="gallery-container">
      <header className="gallery-header">
        <h1 className="gallery-brand">PicPocket</h1>
        <div className="gallery-user">
          <span>{userEmail}</span>
          <button className="sign-out-btn" onClick={onSignOut}>Sign Out</button>
        </div>
      </header>

      <main className="gallery-main">
        <div
          className={`drop-zone ${dragging ? 'drop-zone--active' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current.click()}
          aria-label="Upload photos"
        >
          <span className="drop-zone-icon">📷</span>
          <p>Drop photos here or <strong>click to upload</strong></p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>

        {photos.length === 0 ? (
          <p className="gallery-empty">No photos yet. Upload some memories!</p>
        ) : (
          <div className="photo-grid">
            {photos.map((photo) => (
              <div key={photo.id} className="photo-item">
                <img src={photo.url} alt={photo.name} />
                <button
                  className="photo-remove"
                  onClick={() => removePhoto(photo.id)}
                  aria-label={`Remove ${photo.name}`}
                >
                  ✕
                </button>
                <p className="photo-name">{photo.name}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default PhotoGallery;
