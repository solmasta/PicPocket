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
      refreshPhotos();
      return;
    }
    
    setIsSearching(true);
    // In a real implementation, you would call a search API
    // For now, we'll just filter the existing photos
    // A real implementation would use photoService.searchPhotos(query)
  }, [refreshPhotos]);

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
          <button onClick={handleRefresh} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      <PhotoGrid 
        photos={photos} 
        onDelete={handleDeletePhoto}
        onUpdateTags={handleUpdateTags}
      />
      
      {isSearching && searchQuery && (
        <div className="search-results-info">
          <p>Search results for "{searchQuery}"</p>
          <button onClick={() => handleSearch('')}>Clear Search</button>
        </div>
      )}
      
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
          <p>Your gallery is empty. Upload some photos to get started!</p>
        </div>
      )}
    </div>
  );
}

export default PhotoGallery;