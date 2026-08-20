import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { usePhotos } from '../../hooks/usePhotos';
import PhotoCard from './PhotoCard';
import './PhotoGallery.css';

const PhotoGallery = ({ onPhotoSelect }) => {
  const { t } = useTranslation();
  const { photos, filteredPhotos, isLoading } = usePhotos();
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const displayPhotos = filteredPhotos.length > 0 ? filteredPhotos : photos;

  const sortedPhotos = useMemo(() => {
    return [...displayPhotos].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt) - new Date(b.createdAt);
          break;
        case 'name':
          comparison = (a.title || '').localeCompare(b.title || '');
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        default:
          comparison = new Date(a.createdAt) - new Date(b.createdAt);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [displayPhotos, sortBy, sortOrder]);

  const handleSortChange = useCallback((newSortBy, newSortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setShowSortMenu(false);
  }, []);

  const handleSelectPhoto = useCallback((photo) => {
    setSelectedPhotos(prev => {
      const isSelected = prev.some(p => p.id === photo.id);
      if (isSelected) {
        return prev.filter(p => p.id !== photo.id);
      }
      return [...prev, photo];
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedPhotos.length === sortedPhotos.length) {
      setSelectedPhotos([]);
    } else {
      setSelectedPhotos([...sortedPhotos]);
    }
  }, [selectedPhotos.length, sortedPhotos]);

  const clearSelection = useCallback(() => {
    setSelectedPhotos([]);
  }, []);

  const sortOptions = [
    { value: 'date-desc', label: 'Newest First', sortBy: 'date', sortOrder: 'desc' },
    { value: 'date-asc', label: 'Oldest First', sortBy: 'date', sortOrder: 'asc' },
    { value: 'name-asc', label: 'Name A-Z', sortBy: 'name', sortOrder: 'asc' },
    { value: 'name-desc', label: 'Name Z-A', sortBy: 'name', sortOrder: 'desc' },
    { value: 'size-desc', label: 'Largest First', sortBy: 'size', sortOrder: 'desc' },
    { value: 'size-asc', label: 'Smallest First', sortBy: 'size', sortOrder: 'asc' },
  ];

  const currentSortLabel = sortOptions.find(
    opt => opt.sortBy === sortBy && opt.sortOrder === sortOrder
  )?.label || 'Newest First';

  if (isLoading) {
    return (
      <div className="gallery-loading">
        <div className="loading-spinner">
          <span className="spinner-icon">🐴</span>
        </div>
        <p>Loading your magical memories...</p>
      </div>
    );
  }

  if (sortedPhotos.length === 0) {
    return (
      <div className="gallery-empty">
        <div className="empty-illustration">
          <span className="empty-icon">📷</span>
          <div className="empty-sparkles">
            <span className="sparkle">✨</span>
            <span className="sparkle">✨</span>
            <span className="sparkle">✨</span>
          </div>
        </div>
        <h3>No photos yet!</h3>
        <p>Start adding your magical moments</p>
        <a href="/upload" className="empty-cta">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17,8 12,3 7,8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Add Photos
        </a>
      </div>
    );
  }

  return (
    <div className="photo-gallery">
      {/* Toolbar */}
      <div className="gallery-toolbar">
        <div className="toolbar-left">
          <span className="photo-count">
            {selectedPhotos.length > 0 ? (
              <>{selectedPhotos.length} selected <button onClick={clearSelection}>Clear</button></>
            ) : (
              <>{sortedPhotos.length} magical moments</>
            )}
          </span>
        </div>

        <div className="toolbar-right">
          {/* Select All */}
          <button
            className={`toolbar-btn select-all ${selectedPhotos.length === sortedPhotos.length ? 'active' : ''}`}
            onClick={handleSelectAll}
            aria-label="Select all photos"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <polyline points="9,11 12,14 22,4"/>
            </svg>
          </button>

          {/* Sort */}
          <div className="sort-dropdown">
            <button
              className="toolbar-btn sort-btn"
              onClick={() => setShowSortMenu(!showSortMenu)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M6 12h12M9 18h6"/>
              </svg>
              <span>{currentSortLabel}</span>
              <svg className="dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6,9 12,15 18,9"/>
              </svg>
            </button>
            
            {showSortMenu && (
              <div className="sort-menu">
                {sortOptions.map(option => (
                  <button
                    key={option.value}
                    className={`sort-option ${sortBy === option.sortBy && sortOrder === option.sortOrder ? 'active' : ''}`}
                    onClick={() => handleSortChange(option.sortBy, option.sortOrder)}
                  >
                    {option.label}
                    {sortBy === option.sortBy && sortOrder === option.sortOrder && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20,6 9,17 4,12"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
              </svg>
            </button>
            <button
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6"/>
                <line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/>
                <line x1="3" y1="12" x2="3.01" y2="12"/>
                <line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Photo Grid */}
      <div className={`photo-grid ${viewMode}`}>
        {sortedPhotos.map(photo => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            onSelect={handleSelectPhoto}
            isSelected={selectedPhotos.some(p => p.id === photo.id)}
            viewMode={viewMode}
          />
        ))}
      </div>
    </div>
  );
};

export default PhotoGallery;