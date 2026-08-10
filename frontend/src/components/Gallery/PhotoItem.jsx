import React, { useState, useCallback } from 'react';
import './PhotoItem.css';

function PhotoItem({ photo, onDelete, onUpdateTags }) {
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [tagInput, setTagInput] = useState(photo.tags?.join(', ') || '');
  const [showDetails, setShowDetails] = useState(false);

  const handleDelete = useCallback(() => {
    if (window.confirm('Are you sure you want to delete this photo?')) {
      onDelete(photo.id);
    }
  }, [photo.id, onDelete]);

  const handleTagsClick = useCallback(() => {
    setIsEditingTags(true);
    setTagInput(photo.tags?.join(', ') || '');
  }, [photo.tags]);

  const handleTagsSave = useCallback(() => {
    const tags = tagInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    onUpdateTags(photo.id, tags);
    setIsEditingTags(false);
  }, [photo.id, tagInput, onUpdateTags]);

  const handleTagsCancel = useCallback(() => {
    setIsEditingTags(false);
    setTagInput(photo.tags?.join(', ') || '');
  }, [photo.tags]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Check if photo has horse-related tags
  const hasHorseTags = photo.tags?.some(tag => 
    tag.toLowerCase().includes('horse') || 
    tag.toLowerCase().includes('pony') ||
    tag.toLowerCase().includes('mare') ||
    tag.toLowerCase().includes('stallion') ||
    tag.toLowerCase().includes('foal')
  );

  return (
    <div className={`photo-item ${hasHorseTags ? 'horse-theme' : ''}`}>
      <div className="photo-preview">
        {photo.fileType?.startsWith('image/') ? (
          <img 
            src={photo.url || `https://placehold.co/300x300?text=${photo.fileName}`} 
            alt={photo.fileName}
            onError={(e) => {
              e.target.src = 'https://placehold.co/300x300?text=Image+NotFound';
            }}
          />
        ) : (
          <div className="file-placeholder">
            <span>{photo.fileType?.split('/')[1] || 'FILE'}</span>
          </div>
        )}
        
        {!photo.syncedToServer && (
          <div className="sync-status">
            <span className="sync-pending">Not synced</span>
          </div>
        )}
        
        <button 
          className="delete-button" 
          onClick={handleDelete}
          aria-label="Delete photo"
        >
          ×
        </button>
      </div>
      
      <div className="photo-info">
        <div className="photo-name" title={photo.fileName}>
          {photo.fileName}
        </div>
        
        <div className="photo-meta">
          <span className="file-size">{formatFileSize(photo.fileSize)}</span>
          <span className="upload-date">{formatDate(photo.uploadDate)}</span>
        </div>
        
        <div className="photo-tags">
          {isEditingTags ? (
            <div className="tags-edit">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Enter tags separated by commas"
                aria-label="Edit tags"
              />
              <div className="tags-edit-buttons">
                <button onClick={handleTagsSave} aria-label="Save tags">Save</button>
                <button onClick={handleTagsCancel} aria-label="Cancel editing tags">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="tags-display">
              {photo.tags && photo.tags.length > 0 ? (
                <div className="tags-list">
                  {photo.tags.map((tag, index) => (
                    <span 
                      key={index} 
                      className={`tag ${tag.toLowerCase().includes('horse') ? 'horse-tag' : ''}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="no-tags">No tags</span>
              )}
              <button 
                className="edit-tags-button" 
                onClick={handleTagsClick}
                aria-label="Edit tags"
              >
                Edit Tags
              </button>
            </div>
          )}
        </div>
        
        {photo.location && (
          <div className="photo-location">
            <span className="location-icon">📍</span>
            <span>
              {photo.location.latitude.toFixed(4)}, {photo.location.longitude.toFixed(4)}
            </span>
          </div>
        )}
        
        <button 
          className="toggle-details" 
          onClick={() => setShowDetails(!showDetails)}
          aria-expanded={showDetails}
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
        
        {showDetails && (
          <div className="photo-details">
            <div>
              <span className="photo-details-label">ID:</span>
              <span>{photo.id}</span>
            </div>
            <div>
              <span className="photo-details-label">Type:</span>
              <span>{photo.fileType}</span>
            </div>
            {photo.cloudBackup && Object.keys(photo.cloudBackup).length > 0 && (
              <div>
                <span className="photo-details-label">Backed up to:</span>
                <span>{Object.keys(photo.cloudBackup).join(', ')}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PhotoItem;