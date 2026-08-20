import { useState, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { usePhotos } from '../../hooks/usePhotos';
import './PhotoCard.css';

const PhotoCard = memo(({ photo, onSelect, isSelected = false, viewMode = 'grid' }) => {
  const { t } = useTranslation();
  const { deletePhoto, updatePhoto } = usePhotos();
  const [isLoading, setIsLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm(t('photos.confirmDelete'))) {
      await deletePhoto(photo.id);
    }
    setShowMenu(false);
  };

  const handleFavorite = async (e) => {
    e.stopPropagation();
    await updatePhoto(photo.id, { favorite: !photo.favorite });
    setShowMenu(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <article
      className={`photo-card ${isSelected ? 'selected' : ''} ${viewMode}`}
      onClick={() => onSelect?.(photo)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="photo-card-inner">
        {/* Image Container */}
        <div className="photo-image-container">
          {isLoading && (
            <div className="photo-skeleton">
              <div className="skeleton-shimmer" />
              <span className="skeleton-icon">📷</span>
            </div>
          )}
          <img
            src={photo.url}
            alt={photo.title || t('photos.untitled')}
            className={`photo-image ${isLoading ? 'loading' : ''}`}
            onLoad={handleImageLoad}
            loading="lazy"
          />
          
          {/* Overlay */}
          <div className={`photo-overlay ${isHovered ? 'visible' : ''}`}>
            <div className="overlay-actions">
              <button
                className={`action-btn favorite ${photo.favorite ? 'active' : ''}`}
                onClick={handleFavorite}
                aria-label={photo.favorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <svg viewBox="0 0 24 24" fill={photo.favorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </button>
              <button
                className="action-btn menu"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                aria-label="More options"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="1"/>
                  <circle cx="12" cy="5" r="1"/>
                  <circle cx="12" cy="19" r="1"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Selection Checkbox */}
          <div className="photo-checkbox">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect?.(photo)}
              aria-label="Select photo"
            />
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
          </div>

          {/* Favorite Badge */}
          {photo.favorite && (
            <div className="favorite-badge">
              <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="photo-info">
          <h3 className="photo-title">{photo.title || t('photos.untitled')}</h3>
          <div className="photo-meta">
            <span className="photo-date">{formatDate(photo.date || photo.createdAt)}</span>
            <span className="photo-size">{formatSize(photo.size)}</span>
          </div>
          
          {/* Tags */}
          {photo.tags && photo.tags.length > 0 && (
            <div className="photo-tags">
              {photo.tags.slice(0, 3).map(tag => (
                <span key={tag} className="photo-tag">{tag}</span>
              ))}
              {photo.tags.length > 3 && (
                <span className="photo-tag more">+{photo.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>

        {/* Menu Dropdown */}
        {showMenu && (
          <div className="photo-menu" onClick={(e) => e.stopPropagation()}>
            <button className="menu-item" onClick={handleFavorite}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              {photo.favorite ? 'Remove Favorite' : 'Add to Favorites'}
            </button>
            <button className="menu-item" onClick={() => setShowMenu(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Copy Link
            </button>
            <button className="menu-item" onClick={() => setShowMenu(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7,10 12,15 17,10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download
            </button>
            <div className="menu-divider" />
            <button className="menu-item danger" onClick={handleDelete}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3,6 5,6 21,6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              Delete
            </button>
          </div>
        )}
      </div>
    </article>
  );
});

PhotoCard.displayName = 'PhotoCard';

export default PhotoCard;