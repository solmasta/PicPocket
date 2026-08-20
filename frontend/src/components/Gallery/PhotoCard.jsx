import React, { useState } from 'react';
import './PhotoCard.css';

function PhotoCard({ photo, onDelete, onSelect, viewMode }) {
  const [showActions, setShowActions] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete(photo.id);
    } else {
      setConfirmDelete(true);
    }
  };

  const handleCancelDelete = (e) => {
    e.stopPropagation();
    setConfirmDelete(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(photo);
    }
  };

  if (viewMode === 'list') {
    return (
      <div
        className="photo-card list-card"
        role="listitem"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label={`Photo ${photo.fileName}, uploaded ${formatDate(photo.uploadDate)}`}
      >
        <img
          src={photo.thumbnail || photo.dataUrl}
          alt={photo.fileName}
          className="list-thumbnail"
          onClick={() => onSelect(photo)}
          loading="lazy"
        />
        <div className="list-info">
          <span className="list-name">{photo.fileName}</span>
          <span className="list-date">{formatDate(photo.uploadDate)}</span>
          <span className="list-size">{formatFileSize(photo.fileSize)}</span>
          {photo.location && (
            <span className="list-location" aria-label={`Location: ${photo.location.name}`}>📍 {photo.location.name}</span>
          )}
          <div className="list-tags" role="list" aria-label="Photo tags">
            {(photo.tags || []).map((tag) => (
              <span key={tag} className="tag-badge" role="listitem">
                #{tag}
              </span>
            ))}
          </div>
        </div>
        <div className="list-actions">
          <button
            className="action-btn edit-btn"
            onClick={() => onSelect(photo)}
            title="Edit"
            aria-label="Edit photo"
          >
            ✏️
          </button>
          {confirmDelete ? (
            <>
              <button
                className="action-btn confirm-delete-btn"
                onClick={handleDelete}
                aria-label="Confirm delete"
              >
                Confirm
              </button>
              <button
                className="action-btn cancel-btn"
                onClick={handleCancelDelete}
                aria-label="Cancel delete"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              className="action-btn delete-btn"
              onClick={handleDelete}
              title="Delete"
              aria-label="Delete photo"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="photo-card grid-card"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setConfirmDelete(false);
      }}
      role="listitem"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`Photo ${photo.fileName}, uploaded ${formatDate(photo.uploadDate)}`}
    >
      <div className="card-image-wrap" onClick={() => onSelect(photo)}>
        <img
          src={photo.thumbnail || photo.dataUrl}
          alt={photo.fileName}
          className="card-image"
          loading="lazy"
        />
        {photo.filter && photo.filter !== 'none' && (
          <span className="filter-badge" aria-label={`Filter: ${photo.filter}`}>{photo.filter}</span>
        )}
        {photo.isPublic && <span className="public-badge" aria-label="Public photo">Public</span>}
        {photo.cloudBackup?.googleDrive && (
          <span className="cloud-badge" aria-label="Backed up to Google Drive">☁️</span>
        )}
        {photo.cloudBackup?.googlePhotos && (
          <span className="cloud-badge photos-badge" aria-label="Backed up to Google Photos">🖼️</span>
        )}
        {photo.cloudBackup?.oneDrive && (
          <span className="cloud-badge onedrive-badge" aria-label="Backed up to OneDrive">🟦</span>
        )}
        {photo.cloudBackup?.dropbox && (
          <span className="cloud-badge dropbox-badge" aria-label="Backed up to Dropbox">🔵</span>
        )}
      </div>

      {showActions && (
        <div className="card-overlay" role="toolbar" aria-label="Photo actions">
          {confirmDelete ? (
            <div className="delete-confirm">
              <p id="delete-confirm-text">Delete this photo?</p>
              <div className="confirm-btns">
                <button
                  className="btn-danger-sm"
                  onClick={handleDelete}
                  aria-describedby="delete-confirm-text"
                >
                  Delete
                </button>
                <button
                  className="btn-secondary-sm"
                  onClick={handleCancelDelete}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="card-actions">
              <button
                className="card-action-btn"
                onClick={() => onSelect(photo)}
                title="Edit & Filter"
                aria-label="Edit and apply filters"
              >
                ✏️
              </button>
              <button
                className="card-action-btn delete"
                onClick={handleDelete}
                title="Delete"
                aria-label="Delete photo"
              >
                🗑️
              </button>
            </div>
          )}
        </div>
      )}

      <div className="card-meta">
        <p className="meta-filename" title={photo.fileName}>
          {photo.fileName}
        </p>
        <p className="meta-date">{formatDate(photo.uploadDate)}</p>
        <p className="meta-size">{formatFileSize(photo.fileSize)}</p>
        {photo.location && (
          <p className="meta-location" aria-label={`Location: ${photo.location.name}`}>📍 {photo.location.name}</p>
        )}
        <div className="card-tags" role="list" aria-label="Photo tags">
          {(photo.tags || []).slice(0, 3).map((tag) => (
            <span key={tag} className="tag-badge" role="listitem">
              #{tag}
            </span>
          ))}
          {(photo.tags || []).length > 3 && (
            <span className="tag-more">+{photo.tags.length - 3}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default PhotoCard;