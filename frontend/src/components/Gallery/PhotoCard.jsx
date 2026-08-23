import React, { useState, useCallback, memo } from 'react';
import './PhotoCard.css';

const ACTION_BUTTONS = {
  favorite: { icon: '🤍', activeIcon: '❤️', label: 'Add to favorites', activeLabel: 'Remove from favorites' },
  delete: { icon: '🗑️', label: 'Delete photo' },
  confirm: { icon: '✅', label: 'Confirm delete' },
  cancel: { icon: '❌', label: 'Cancel delete' }
};

const PhotoCard = memo(function PhotoCard({ photo, onDelete, onSelect, viewMode }) {
  const [showActions, setShowActions] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const formatDate = useCallback((dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  const handleFavorite = useCallback((e) => {
    e.stopPropagation();
    // Favorite functionality would go here
  }, []);

  const handleDeleteClick = useCallback((e) => {
    e.stopPropagation();
    setConfirmDelete(true);
  }, []);

  const handleConfirmDelete = useCallback((e) => {
    e.stopPropagation();
    onDelete(photo.id);
    setConfirmDelete(false);
  }, [onDelete, photo.id]);

  const handleCancelDelete = useCallback((e) => {
    e.stopPropagation();
    setConfirmDelete(false);
  }, []);

  const renderActionButtons = useCallback(() => {
    if (confirmDelete) {
      return (
        <>
          <button 
            className="photo-card__action"
            onClick={handleConfirmDelete}
            aria-label={ACTION_BUTTONS.confirm.label}
          >
            {ACTION_BUTTONS.confirm.icon}
          </button>
          <button 
            className="photo-card__action"
            onClick={handleCancelDelete}
            aria-label={ACTION_BUTTONS.cancel.label}
          >
            {ACTION_BUTTONS.cancel.icon}
          </button>
        </>
      );
    }

    return (
      <>
        <button 
          className={`photo-card__action ${photo.isFavorite ? 'photo-card__action--active' : ''}`}
          onClick={handleFavorite}
          aria-label={photo.isFavorite ? ACTION_BUTTONS.favorite.activeLabel : ACTION_BUTTONS.favorite.label}
        >
          {photo.isFavorite ? ACTION_BUTTONS.favorite.activeIcon : ACTION_BUTTONS.favorite.icon}
        </button>
        <button 
          className="photo-card__action"
          onClick={handleDeleteClick}
          aria-label={ACTION_BUTTONS.delete.label}
        >
          {ACTION_BUTTONS.delete.icon}
        </button>
      </>
    );
  }, [confirmDelete, handleConfirmDelete, handleCancelDelete, handleFavorite, handleDeleteClick, photo.isFavorite]);

  const renderTags = useCallback(() => {
    if (!photo.tags || photo.tags.length === 0) return null;
    
    return (
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
    );
  }, [photo.tags]);

  const renderBadges = useCallback(() => {
    const badges = [];
    
    if (photo.isFavorite) {
      badges.push(
        <span key="favorite" className="photo-card__badge photo-card__badge--favorite">
          ❤️
        </span>
      );
    }
    
    if (photo.isAnimated) {
      badges.push(
        <span key="animated" className="photo-card__badge photo-card__badge--animated">
          GIF
        </span>
      );
    }
    
    if (photo.storageLocation === 'cloud') {
      badges.push(
        <span key="cloud" className="photo-card__badge photo-card__badge--cloud">
          ☁️
        </span>
      );
    }

    if (badges.length === 0) return null;
    
    return <div className="photo-card__badges">{badges}</div>;
  }, [photo.isFavorite, photo.isAnimated, photo.storageLocation]);

  const renderLocation = useCallback(() => {
    if (!photo.location) return null;
    
    return (
      <div className="photo-card__location">
        📍 {photo.location}
      </div>
    );
  }, [photo.location]);

  const renderGridView = useCallback(() => (
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
      aria-label={`Photo taken on ${formatDate(photo.uploadDate || photo.date)}`}
    >
      <div className="photo-card__image-container">
        {photo.thumbnail || photo.thumbnailUrl ? (
          <img 
            src={photo.thumbnail || photo.thumbnailUrl} 
            alt={photo.fileName || photo.title || `Photo from ${formatDate(photo.uploadDate || photo.date)}`}
            className="photo-card__image"
            loading="lazy"
          />
        ) : photo.dataUrl ? (
          <img 
            src={photo.dataUrl} 
            alt={photo.fileName || photo.title || `Photo from ${formatDate(photo.uploadDate || photo.date)}`}
            className="photo-card__image"
            loading="lazy"
          />
        ) : (
          <div className="photo-card__skeleton" />
        )}
      </div>
      
      <div className="photo-card__overlay">
        <div className="photo-card__actions">
          {renderActionButtons()}
        </div>
        
        <div className="photo-card__info">
          <div className="photo-card__date">{formatDate(photo.uploadDate || photo.date)}</div>
          {renderLocation()}
        </div>
      </div>
      
      {renderTags()}
      {renderBadges()}
    </div>
  ), [photo, onSelect, formatDate, renderActionButtons, renderTags, renderBadges, renderLocation]);

  const renderListView = useCallback(() => (
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
      aria-label={`Photo taken on ${formatDate(photo.uploadDate || photo.date)}, titled ${photo.fileName || photo.title || 'Untitled'}`}
    >
      {photo.thumbnail || photo.thumbnailUrl ? (
        <img 
          src={photo.thumbnail || photo.thumbnailUrl} 
          alt={photo.fileName || photo.title || `Photo from ${formatDate(photo.uploadDate || photo.date)}`}
          className="list-thumbnail"
          loading="lazy"
        />
      ) : photo.dataUrl ? (
        <img 
          src={photo.dataUrl} 
          alt={photo.fileName || photo.title || `Photo from ${formatDate(photo.uploadDate || photo.date)}`}
          className="list-thumbnail"
          loading="lazy"
        />
      ) : (
        <div className="photo-card__skeleton" style={{ width: 60, height: 60 }} />
      )}
      
      <div className="list-info">
        <div className="list-name">{photo.fileName || photo.title || 'Untitled'}</div>
        <div className="list-date">📅 {formatDate(photo.uploadDate || photo.date)}</div>
        <div className="list-size">💾 {photo.fileSize ? `${(photo.fileSize / 1024 / 1024).toFixed(1)} MB` : 'Unknown size'}</div>
        {renderLocation()}
        {renderTags()}
      </div>
      
      <div className="list-actions">
        {renderActionButtons()}
      </div>
    </div>
  ), [photo, onSelect, formatDate, renderActionButtons, renderTags, renderLocation]);

  return viewMode === 'list' ? renderListView() : renderGridView();
});

export default PhotoCard;