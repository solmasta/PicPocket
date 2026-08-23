import React, { useState } from 'react';
import './PhotoCard.css';

function PhotoCard({ photo, onDelete, onSelect, viewMode }) {
  const [showActions, setShowActions] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleFavorite = (e) => {
    e.stopPropagation();
    // Favorite functionality would go here
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setConfirmDelete(true);
  };

  const handleConfirmDelete = (e) => {
    e.stopPropagation();
    onDelete(photo.id);
    setConfirmDelete(false);
  };

  const handleCancelDelete = (e) => {
    e.stopPropagation();
    setConfirmDelete(false);
  };

  const renderGridView = () => (
    <div 
      className="photo-card"
      onClick={() => onSelect(photo)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(photo);
        }
      }}
      aria-label={`Photo taken on ${formatDate(photo.date)}`}
    >
      <div className="photo-card__image-container">
        {photo.thumbnailUrl ? (
          <img 
            src={photo.thumbnailUrl} 
            alt={photo.title || `Photo from ${formatDate(photo.date)}`}
            className="photo-card__image"
            loading="lazy"
          />
        ) : (
          <div className="photo-card__skeleton" />
        )}
      </div>
      
      <div className="photo-card__overlay">
        <div className="photo-card__actions">
          <button 
            className={`photo-card__action ${photo.isFavorite ? 'photo-card__action--active' : ''}`}
            onClick={handleFavorite}
            aria-label={photo.isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            {photo.isFavorite ? '❤️' : '🤍'}
          </button>
          
          {confirmDelete ? (
            <>
              <button 
                className="photo-card__action"
                onClick={handleConfirmDelete}
                aria-label="Confirm delete"
              >
                ✅
              </button>
              <button 
                className="photo-card__action"
                onClick={handleCancelDelete}
                aria-label="Cancel delete"
              >
                ❌
              </button>
            </>
          ) : (
            <button 
              className="photo-card__action"
              onClick={handleDeleteClick}
              aria-label="Delete photo"
            >
              🗑️
            </button>
          )}
        </div>
        
        <div className="photo-card__info">
          <div className="photo-card__date">{formatDate(photo.date)}</div>
          {photo.location && (
            <div className="photo-card__location">
              📍 {photo.location}
            </div>
          )}
        </div>
      </div>
      
      {photo.tags && photo.tags.length > 0 && (
        <div className="photo-card__tags">
          {photo.tags.slice(0, 3).map((tag, index) => (
            <span key={index} className="photo-card__tag">
              {tag}
            </span>
          ))}
          {photo.tags.length > 3 && (
            <span className="photo-card__tag">
              +{photo.tags.length - 3}
            </span>
          )}
        </div>
      )}
      
      <div className="photo-card__badges">
        {photo.isFavorite && (
          <span className="photo-card__badge photo-card__badge--favorite">
            ❤️
          </span>
        )}
        {photo.isAnimated && (
          <span className="photo-card__badge photo-card__badge--animated">
            GIF
          </span>
        )}
        {photo.storageLocation === 'cloud' && (
          <span className="photo-card__badge photo-card__badge--cloud">
            ☁️
          </span>
        )}
      </div>
    </div>
  );

  const renderListView = () => (
    <div 
      className="list-card"
      onClick={() => onSelect(photo)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(photo);
        }
      }}
      aria-label={`Photo taken on ${formatDate(photo.date)}, titled ${photo.title || 'Untitled'}`}
    >
      {photo.thumbnailUrl ? (
        <img 
          src={photo.thumbnailUrl} 
          alt={photo.title || `Photo from ${formatDate(photo.date)}`}
          className="list-thumbnail"
          loading="lazy"
        />
      ) : (
        <div className="photo-card__skeleton" style={{ width: 60, height: 60 }} />
      )}
      
      <div className="list-info">
        <div className="list-name">{photo.title || 'Untitled'}</div>
        <div className="list-date">📅 {formatDate(photo.date)}</div>
        <div className="list-size">💾 {photo.size || 'Unknown size'}</div>
        {photo.location && (
          <div className="list-location">📍 {photo.location}</div>
        )}
        {photo.tags && photo.tags.length > 0 && (
          <div className="list-tags">
            {photo.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="photo-card__tag">
                {tag}
              </span>
            ))}
            {photo.tags.length > 3 && (
              <span className="photo-card__tag">
                +{photo.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
      
      <div className="list-actions">
        <button 
          className={`photo-card__action ${photo.isFavorite ? 'photo-card__action--active' : ''}`}
          onClick={handleFavorite}
          aria-label={photo.isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          {photo.isFavorite ? '❤️' : '🤍'}
        </button>
        
        {confirmDelete ? (
          <>
            <button 
              className="photo-card__action"
              onClick={handleConfirmDelete}
              aria-label="Confirm delete"
            >
              ✅
            </button>
            <button 
              className="photo-card__action"
              onClick={handleCancelDelete}
              aria-label="Cancel delete"
            >
              ❌
            </button>
          </>
        ) : (
          <button 
            className="photo-card__action"
            onClick={handleDeleteClick}
            aria-label="Delete photo"
          >
            🗑️
          </button>
        )}
      </div>
    </div>
  );

  return viewMode === 'list' ? renderListView() : renderGridView();
}

export default PhotoCard;