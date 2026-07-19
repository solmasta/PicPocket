import React, { useState } from 'react';
import PhotoCard from './PhotoCard';
import './PhotoGallery.css';

const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Newest First' },
  { value: 'date-asc', label: 'Oldest First' },
  { value: 'name', label: 'File Name' },
  { value: 'size-desc', label: 'Largest First' },
];

function PhotoGallery({ photos, loading, onDelete, onSelect, onViewChange }) {
  const [sortBy, setSortBy] = useState('date-desc');
  const [filterTag, setFilterTag] = useState('');
  const [viewMode, setViewMode] = useState('grid');

  const allTags = [...new Set(photos.flatMap((p) => p.tags || []))].sort();

  const sortedPhotos = [...photos]
    .filter((p) => !filterTag || (p.tags || []).includes(filterTag))
    .sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return new Date(a.uploadDate) - new Date(b.uploadDate);
        case 'name':
          return a.fileName.localeCompare(b.fileName);
        case 'size-desc':
          return b.fileSize - a.fileSize;
        default:
          return new Date(b.uploadDate) - new Date(a.uploadDate);
      }
    });

  const handlePhotoSelect = (photo) => {
    onSelect(photo);
    onViewChange('filters');
  };

  if (loading) {
    return (
      <div className="gallery-loading">
        <div className="loading-spinner" />
        <p>Loading your photos...</p>
      </div>
    );
  }

  return (
    <div className="photo-gallery">
      <div className="gallery-toolbar">
        <div className="gallery-stats">
          <h2>My Photos</h2>
          <span className="photo-count">{photos.length} photo{photos.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="gallery-controls">
          {allTags.length > 0 && (
            <select
              className="filter-select"
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              aria-label="Filter by tag"
            >
              <option value="">All Tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  #{tag}
                </option>
              ))}
            </select>
          )}

          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort photos"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              ⊞
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              ≡
            </button>
          </div>
        </div>
      </div>

      {sortedPhotos.length === 0 ? (
        <div className="gallery-empty">
          <span className="empty-icon">📷</span>
          <h3>No photos yet</h3>
          <p>Upload your first photo to get started!</p>
          <button className="btn-primary" onClick={() => onViewChange('upload')}>
            Upload Photos
          </button>
        </div>
      ) : (
        <div className={`photo-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
          {sortedPhotos.map((photo) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              onDelete={onDelete}
              onSelect={handlePhotoSelect}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default PhotoGallery;
