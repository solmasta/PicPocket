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

  if (viewMode === 'list') {
    return (
      <div className="photo-card list-card">
        <img
          src={photo.thumbnail || photo.dataUrl}
          alt={photo.fileName}
          className="list-thumbnail"
          onClick={() => onSelect(photo)}
        />
        <div className="list-info">
          <span className="list-name">{photo.fileName}</span>
          <span className="list-date">{formatDate(photo.uploadDate)}</span>
          <span className="list-size">{formatFileSize(photo.fileSize)}</span>
          {photo.location && (
            <span className="list-location">📍 {photo.location.name}</span>
          )}
          <div className="list-tags">
            {(photo.tags || []).map((tag) => (
              <span key={tag} className="tag-badge">
                #{tag}
              </span>
            ))}
          </div>
        </div>
        <div className="list-actions">
          <button className="action-btn edit-btn" onClick={() => onSelect(photo)} title="Edit">
            ✏️
          </button>
          {confirmDelete ? (
            <>
              <button className="action-btn confirm-delete-btn" onClick={handleDelete}>
                Confirm
              </button>
              <button className="action-btn cancel-btn" onClick={handleCancelDelete}>
                Cancel
              </button>
            </>
          ) : (
            <button className="action-btn delete-btn" onClick={handleDelete} title="Delete">
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
    >
      <div className="card-image-wrap" onClick={() => onSelect(photo)}>
        <img
          src={photo.thumbnail || photo.dataUrl}
          alt={photo.fileName}
          className="card-image"
          loading="lazy"
        />
        {photo.filter && photo.filter !== 'none' && (
          <span className="filter-badge">{photo.filter}</span>
        )}
        {photo.isPublic && <span className="public-badge">Public</span>}
        {photo.cloudBackup?.googleDrive && (
          <span className="cloud-badge" title="Backed up to Google Drive">☁️</span>
        )}
      </div>

      {showActions && (
        <div className="card-overlay">
          {confirmDelete ? (
            <div className="delete-confirm">
              <p>Delete this photo?</p>
              <div className="confirm-btns">
                <button className="btn-danger-sm" onClick={handleDelete}>
                  Delete
                </button>
                <button className="btn-secondary-sm" onClick={handleCancelDelete}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="card-actions">
              <button className="card-action-btn" onClick={() => onSelect(photo)} title="Edit & Filter">
                ✏️
              </button>
              <button className="card-action-btn delete" onClick={handleDelete} title="Delete">
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
          <p className="meta-location">📍 {photo.location.name}</p>
        )}
        <div className="card-tags">
          {(photo.tags || []).slice(0, 3).map((tag) => (
            <span key={tag} className="tag-badge">
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
