import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import PhotoCard from '../PhotoCard/PhotoCard';
import FilterBar from '../FilterBar/FilterBar';
import './PhotoGallery.css';

const LAZY_LOAD_THRESHOLD = 200;
const DEBOUNCE_MS = 150;

export const PhotoGallery = ({
  photos = [],
  onPhotoClick,
  onDelete,
  onFavorite,
  isLoading = false,
  showFilters = true,
  filterMode = 'all',
  sortBy = 'date',
  sortOrder = 'desc',
}) => {
  const [viewMode, setViewMode] = useState('grid');
  const [filterText, setFilterText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState(filterMode);
  const [sortByLocal, setSortByLocal] = useState(sortBy);
  const [sortOrderLocal, setSortOrderLocal] = useState(sortOrder);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const galleryRef = useRef(null);
  const lastScrollY = useRef(0);

  const filteredPhotos = useMemo(() => {
    let result = [...photos];

    if (filterText) {
      const searchLower = filterText.toLowerCase();
      result = result.filter(
        (photo) =>
          photo.fileName?.toLowerCase().includes(searchLower) ||
          photo.tags?.some((tag) => tag.toLowerCase().includes(searchLower)) ||
          photo.location?.toLowerCase().includes(searchLower)
      );
    }

    if (selectedFilter === 'favorites') {
      result = result.filter((photo) => photo.isFavorite);
    } else if (selectedFilter === 'recent') {
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      result = result.filter((photo) => new Date(photo.dateAdded).getTime() > weekAgo);
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortByLocal) {
        case 'date':
          comparison = new Date(a.dateAdded) - new Date(b.dateAdded);
          break;
        case 'name':
          comparison = (a.fileName || '').localeCompare(b.fileName || '');
          break;
        case 'size':
          comparison = (a.fileSize || 0) - (b.fileSize || 0);
          break;
        default:
          comparison = 0;
      }
      return sortOrderLocal === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [photos, filterText, selectedFilter, sortByLocal, sortOrderLocal]);

  const handleScroll = useCallback(() => {
    if (!galleryRef.current) return;
    const scrollY = window.scrollY;
    if (scrollY < lastScrollY.current) {
      lastScrollY.current = scrollY;
      return;
    }
    lastScrollY.current = scrollY;
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleSort = (newSortBy, newSortOrder) => {
    setSortByLocal(newSortBy);
    setSortOrderLocal(newSortOrder);
    setShowSortMenu(false);
  };

  const sortOptions = [
    { value: { sortBy: 'date', order: 'desc' }, label: 'Newest First' },
    { value: { sortBy: 'date', order: 'asc' }, label: 'Oldest First' },
    { value: { sortBy: 'name', order: 'asc' }, label: 'Name A-Z' },
    { value: { sortBy: 'name', order: 'desc' }, label: 'Name Z-A' },
    { value: { sortBy: 'size', order: 'desc' }, label: 'Largest First' },
    { value: { sortBy: 'size', order: 'asc' }, label: 'Smallest First' },
  ];

  const currentSortLabel = sortOptions.find(
    (opt) =>
      opt.value.sortBy === sortByLocal && opt.value.order === sortOrderLocal
  )?.label;

  if (isLoading) {
    return (
      <div className="photo-gallery">
        <div className="photo-gallery__loading">
          <div className="photo-gallery__spinner" />
          <p>Loading your photos...</p>
        </div>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="photo-gallery">
        <div className="photo-gallery__empty">
          <div className="photo-gallery__empty-icon">📷</div>
          <h3>No photos yet</h3>
          <p>Upload your first photos to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="photo-gallery" ref={galleryRef}>
      <div className="photo-gallery__header">
        <div className="photo-gallery__count">
          <span className="photo-gallery__count-number">{filteredPhotos.length}</span>
          <span className="photo-gallery__count-label">
            {filteredPhotos.length === 1 ? 'photo' : 'photos'}
          </span>
        </div>

        <div className="photo-gallery__controls">
          <div className="photo-gallery__search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search photos..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="photo-gallery__search-input"
            />
          </div>

          <div className="photo-gallery__sort">
            <button
              className="photo-gallery__sort-btn"
              onClick={() => setShowSortMenu(!showSortMenu)}
              aria-expanded={showSortMenu}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="16" y2="12" />
                <line x1="4" y1="18" x2="12" y2="18" />
              </svg>
              <span>{currentSortLabel}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {showSortMenu && (
              <div className="photo-gallery__sort-menu">
                {sortOptions.map((option) => (
                  <button
                    key={option.label}
                    className={`photo-gallery__sort-option ${
                      option.value.sortBy === sortByLocal &&
                      option.value.order === sortOrderLocal
                        ? 'active'
                        : ''
                    }`}
                    onClick={() => handleSort(option.value.sortBy, option.value.order)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="photo-gallery__view-toggle">
            <button
              className={`photo-gallery__view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
            </button>
            <button
              className={`photo-gallery__view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {showFilters && (
        <FilterBar
          activeFilter={selectedFilter}
          onFilterChange={setSelectedFilter}
        />
      )}

      <div className={`photo-gallery__grid photo-gallery__grid--${viewMode}`}>
        {filteredPhotos.map((photo) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            onSelect={onPhotoClick}
            onDelete={onDelete}
            viewMode={viewMode}
          />
        ))}
      </div>

      {filteredPhotos.length === 0 && photos.length > 0 && (
        <div className="photo-gallery__no-results">
          <p>No photos match your search</p>
          <button onClick={() => setFilterText('')}>Clear search</button>
        </div>
      )}
    </div>
  );
};

export default PhotoGallery;