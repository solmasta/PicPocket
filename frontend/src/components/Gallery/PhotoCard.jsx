import React, { useState } from 'react';
import './PhotoCard.css';

function PhotoCard({ photo, onDelete, onSelect, viewMode }) {
  const [showActions, setShowActions] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (confirmDelete) {
      onDelete?.(photo.id);
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onSelect?.(photo);
    }
  };

  const cardClasses = [
    'photo-card',
    `photo-card--${viewMode || 'grid'}`,
    isLoaded ? 'loaded' : 'loading',
    photo.isFavorite ? 'photo-card--favorite' : '',
  ].filter(Boolean).join(' ');

  return (
    <article
      className={cardClasses}
      onClick={() => onSelect?.(photo)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setConfirmDelete(false);
      }}
      onFocus={() => setShowActions(true)}
      onBlur={() => setShowActions(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Photo: ${photo.fileName}, ${formatDate(photo.dateAdded)}`}
    >
      <div className="photo-card__image-container">
        {!isLoaded && (
          <div className="photo-card__skeleton">
            <div className="photo-card__shimmer" />
          </div>
        )}
        <img
          src={photo.thumbnail || photo.dataUrl}
          alt={photo.fileName}
          className="photo-card__image"
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
        />
        
        {showActions && (
          <div className="photo-card__actions">
            <button
              className="photo-card__action-btn photo-card__action-btn--favorite"
              onClick={(e) => {
                e.stopPropagation();
                onSelect?.(photo, 'favorite');
              }}
              aria-label={photo.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              {photo.isFavorite ? (
                <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              )}
            </button>
            <button
              className={`photo-card__action-btn photo-card__action-btn--delete ${confirmDelete ? 'confirm' : ''}`}
              onClick={handleDelete}
              aria-label={confirmDelete ? 'Confirm delete' : 'Delete photo'}
            >
              {confirmDelete ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Confirm?</span>
                </>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              )}
            </button>
          </div>
        )}

        {photo.cloudBackup && Object.keys(photo.cloudBackup).length > 0 && (
          <div className="photo-card__backup-indicator" aria-label="Backed up to cloud">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
        )}
      </div>

      <div className="photo-card__info">
        <h3 className="photo-card__title">{photo.fileName}</h3>
        <div className="photo-card__meta">
          <span className="photo-card__date">{formatDate(photo.dateAdded)}</span>
          {photo.fileSize && (
            <span className="photo-card__size">{formatFileSize(photo.fileSize)}</span>
          )}
        </div>
        {photo.tags && photo.tags.length > 0 && (
          <div className="photo-card__tags">
            {photo.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="photo-card__tag">
                {tag}
              </span>
            ))}
            {photo.tags.length > 3 && (
              <span className="photo-card__tag photo-card__tag--more">
                +{photo.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export default PhotoCard;