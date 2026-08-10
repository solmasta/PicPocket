import React, { useState, useCallback } from 'react';
import { usePhotos } from '../../hooks/usePhotos';
import PhotoGrid from './PhotoGrid';
import SearchBar from '../Search/SearchBar';
import './PhotoGallery.css';

function PhotoGallery() {
  const { 
    photos, 
    loading, 
    error, 
    hasMore, 
    fetchServerPhotos, 
    loadMore, 
    refreshPhotos,
    deletePhoto,
    updatePhotoTags
  } = usePhotos();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [filteredPhotos, setFilteredPhotos] = useState([]);

  const handleRefresh = useCallback(() => {
    refreshPhotos();
  }, [refreshPhotos]);

  const handleLoadMore = useCallback(() => {
    loadMore();
  }, [loadMore]);

  const handleSearch = useCallback(async (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setIsSearching(false);
      setFilteredPhotos([]);
      return;
    }
    
    setIsSearching(true);
    // Filter photos based on tags, filename, or horse-related terms
    const filtered = photos.filter(photo => {
      const lowerQuery = query.toLowerCase();
      const matchesTags = photo.tags?.some(tag => tag.toLowerCase().includes(lowerQuery));
      const matchesFileName = photo.fileName?.toLowerCase().includes(lowerQuery);
      const matchesHorseTerms = lowerQuery.includes('horse') || 
                               lowerQuery.includes('pony') || 
                               lowerQuery.includes('mare') || 
                               lowerQuery.includes('stallion') || 
                               lowerQuery.includes('foal');
      return matchesTags || matchesFileName || matchesHorseTerms;
    });
    
    setFilteredPhotos(filtered);
  }, [photos]);

  const handleDeletePhoto = useCallback(async (photoId) => {
    try {
      await deletePhoto(photoId);
    } catch (err) {
      console.error('Failed to delete photo:', err);
    }
  }, [deletePhoto]);

  const handleUpdateTags = useCallback(async (photoId, tags) => {
    try {
      await updatePhotoTags(photoId, tags);
    } catch (err) {
      console.error('Failed to update tags:', err);
    }
  }, [updatePhotoTags]);

  // Determine which photos to display
  const displayPhotos = isSearching ? filteredPhotos : photos;

  if (error) {
    return (
      <div className="photo-gallery error">
        <p>Error: {error}</p>
        <button onClick={handleRefresh}>Retry</button>
      </div>
    );
  }

  return (
    <div className="photo-gallery">
      <div className="gallery-header">
        <h2>My Photos</h2>
        <div className="gallery-controls">
          <SearchBar onSearch={handleSearch} />
          <button onClick={handleRefresh} disabled={loading} className="refresh-button">
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      {isSearching && searchQuery && (
        <div className="search-results-info">
          <p>Found {displayPhotos.length} results for "{searchQuery}"</p>
          <button onClick={() => handleSearch('')} className="clear-search-button">Clear Search</button>
        </div>
      )}
      
      <PhotoGrid 
        photos={displayPhotos} 
        onDelete={handleDeletePhoto}
        onUpdateTags={handleUpdateTags}
      />
      
      {!isSearching && hasMore && (
        <div className="load-more-container">
          <button 
            onClick={handleLoadMore} 
            disabled={loading}
            className="load-more-button"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
      
      {!isSearching && !hasMore && photos.length > 0 && (
        <div className="no-more-photos">
          <p>You've reached the end of your photo collection</p>
        </div>
      )}
      
      {!isSearching && photos.length === 0 && !loading && (
        <div className="empty-gallery">
          <div className="empty-gallery-content">
            <span className="empty-gallery-icon">📸</span>
            <h3>Your gallery is empty</h3>
            <p>Upload some photos to get started!</p>
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('viewChange', { detail: 'upload' }))}
              className="upload-photos-button"
            >
              Upload Photos
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PhotoGallery;