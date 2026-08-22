import React, { useMemo, useState } from 'react';
import PhotoCard from './PhotoCard';
import SearchBar from '../Search/SearchBar';
import './PhotoGrid.css';
import './PhotoGallery.css';

// The whole point of PicPocket is to be one ledger over several cloud
// drives, so the gallery itself needs to answer "where does this photo
// actually live?" at a glance — these filters mirror the providers
// StorageLedger reconciles against.
const STORAGE_FILTERS = [
  { key: 'all', label: 'All Photos', icon: '📸' },
  { key: 'unbacked', label: 'Not Backed Up', icon: '⚠️' },
  { key: 'googleDrive', label: 'Google Drive', icon: '☁️' },
  { key: 'googlePhotos', label: 'Google Photos', icon: '🖼️' },
  { key: 'oneDrive', label: 'OneDrive', icon: '🟦' },
  { key: 'dropbox', label: 'Dropbox', icon: '🔵' },
];

function isBackedUpTo(photo, providerKey) {
  return Boolean(photo.cloudBackup?.[providerKey]);
}

function isBackedUpAnywhere(photo) {
  return STORAGE_FILTERS.slice(2).some((f) => isBackedUpTo(photo, f.key));
}

function PhotoGallery({ photos = [], loading, onDelete, onSelect, onViewChange }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [storageFilter, setStorageFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');

  const storageCounts = useMemo(() => {
    const counts = { all: photos.length, unbacked: 0 };
    STORAGE_FILTERS.slice(2).forEach((f) => {
      counts[f.key] = photos.filter((p) => isBackedUpTo(p, f.key)).length;
    });
    counts.unbacked = photos.filter((p) => !isBackedUpAnywhere(p)).length;
    return counts;
  }, [photos]);

  const displayPhotos = useMemo(() => {
    let result = photos;

    if (storageFilter === 'unbacked') {
      result = result.filter((p) => !isBackedUpAnywhere(p));
    } else if (storageFilter !== 'all') {
      result = result.filter((p) => isBackedUpTo(p, storageFilter));
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (p) =>
          (p.tags || []).some((tag) => tag.toLowerCase().includes(q)) ||
          p.fileName?.toLowerCase().includes(q) ||
          (p.location?.name || '').toLowerCase().includes(q) ||
          (p.caption || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [photos, storageFilter, searchQuery]);

  const handleUploadClick = () => {
    if (onViewChange) onViewChange('upload');
  };

  return (
    <div className="photo-gallery">
      <div className="gallery-header">
        <h2 className="gallery-title">My Photos</h2>
        <div className="gallery-controls">
          <SearchBar onSearch={setSearchQuery} onClear={() => setSearchQuery('')} />
          <div className="view-toggle" role="group" aria-label="Change view mode">
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              aria-pressed={viewMode === 'grid'}
              title="Grid view"
            >
              ▦
            </button>
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              aria-pressed={viewMode === 'list'}
              title="List view"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      <div className="storage-filter-bar" role="tablist" aria-label="Filter photos by storage location">
        {STORAGE_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            role="tab"
            aria-selected={storageFilter === f.key}
            className={`storage-filter-chip ${storageFilter === f.key ? 'active' : ''}`}
            onClick={() => setStorageFilter(f.key)}
          >
            <span aria-hidden="true">{f.icon}</span> {f.label}
            <span className="storage-filter-count">{storageCounts[f.key] ?? 0}</span>
          </button>
        ))}
      </div>

      {searchQuery && (
        <div className="search-results-info">
          <p>
            Found {displayPhotos.length} result{displayPhotos.length !== 1 ? 's' : ''} for "{searchQuery}"
          </p>
          <button onClick={() => setSearchQuery('')} className="clear-search-button">
            Clear Search
          </button>
        </div>
      )}

      {loading && photos.length === 0 && <p className="gallery-loading">Loading your photos…</p>}

      {!loading && photos.length === 0 && (
        <div className="empty-gallery">
          <div className="empty-gallery-content">
            <span className="empty-gallery-icon">📸</span>
            <h3>Your gallery is empty</h3>
            <p>Upload some photos to get started!</p>
            <button onClick={handleUploadClick} className="upload-photos-button">
              Upload Photos
            </button>
          </div>
        </div>
      )}

      {!loading && photos.length > 0 && displayPhotos.length === 0 && (
        <div className="empty-gallery">
          <div className="empty-gallery-content">
            <span className="empty-gallery-icon">🔍</span>
            <h3>No photos match this filter</h3>
            <p>Try a different storage location or search term.</p>
          </div>
        </div>
      )}

      {displayPhotos.length > 0 && (
        <div className={`photo-grid ${viewMode === 'list' ? 'photo-grid--list' : ''}`}>
          {displayPhotos.map((photo) => (
            <PhotoCard key={photo.id} photo={photo} onDelete={onDelete} onSelect={onSelect} viewMode={viewMode} />
          ))}
        </div>
      )}
    </div>
  );
}

export default PhotoGallery;
