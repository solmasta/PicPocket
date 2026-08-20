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
  filter = 'all',
  onFilterChange,
}) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  const [isFiltering, setIsFiltering] = useState(false);
  const containerRef = useRef(null);
  const observerRef = useRef(null);
  const lastScrollTop = useRef(0);

  const filteredPhotos = useMemo(() => {
    if (filter === 'all') return photos;
    if (filter === 'favorites') return photos.filter(p => p.isFavorite);
    if (filter === 'recent') {
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return photos.filter(p => p.timestamp > weekAgo);
    }
    if (filter === 'location') return photos.filter(p => p.location);
    if (filter === 'no-location') return photos.filter(p => !p.location);
    return photos;
  }, [photos, filter]);

  const visiblePhotos = useMemo(() => {
    return filteredPhotos.slice(visibleRange.start, visibleRange.end);
  }, [filteredPhotos, visibleRange]);

  useEffect(() => {
    setVisibleRange({ start: 0, end: 50 });
  }, [filter]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const { scrollTop } = containerRef.current;
    const isScrollingDown = scrollTop > lastScrollTop.current;
    lastScrollTop.current = scrollTop;

    if (!isScrollingDown) return;

    const { scrollHeight, clientHeight } = containerRef.current;
    const scrollProgress = scrollTop / (scrollHeight - clientHeight);

    if (scrollProgress > 0.7 && visibleRange.end < filteredPhotos.length) {
      setVisibleRange(prev => ({
        start: prev.start,
        end: Math.min(prev.end + 20, filteredPhotos.length),
      }));
    }
  }, [visibleRange.end, filteredPhotos.length]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    let ticking = false;

    const debouncedScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener('scroll', debouncedScroll, { passive: true });
    return () => container.removeEventListener('scroll', debouncedScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const card = entry.target;
              const index = parseInt(card.dataset.index, 10);
              
              if (!card.querySelector('img')?.src) {
                const photo = filteredPhotos[index];
                if (photo?.thumbnail) {
                  const img = document.createElement('img');
                  img.src = photo.thumbnail;
                  img.alt = photo.alt || 'Photo';
                  img.loading = 'lazy';
                  card.querySelector('.photo-card__image-wrapper')?.appendChild(img);
                }
              }
            }
          });
        },
        { rootMargin: `${LAZY_LOAD_THRESHOLD}px` }
      );
    }

    const cards = containerRef.current?.querySelectorAll('.photo-card');
    cards?.forEach(card => observerRef.current.observe(card));

    return () => {
      observerRef.current?.disconnect();
    };
  }, [visiblePhotos, filteredPhotos]);

  if (isLoading) {
    return (
      <div className="photo-gallery photo-gallery--loading">
        <div className="photo-gallery__spinner" aria-label="Loading photos" />
      </div>
    );
  }

  if (filteredPhotos.length === 0) {
    return (
      <div className="photo-gallery photo-gallery--empty">
        <div className="photo-gallery__empty-state">
          <svg viewBox="0 0 24 24" className="photo-gallery__empty-icon">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
          </svg>
          <h3>No photos found</h3>
          <p>
            {filter !== 'all'
              ? `No ${filter} photos to display. Try changing your filter.`
              : 'Start by adding some photos to your collection.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="photo-gallery" ref={containerRef}>
      {showFilters && (
        <FilterBar
          currentFilter={filter}
          onFilterChange={onFilterChange}
          counts={{
            all: photos.length,
            favorites: photos.filter(p => p.isFavorite).length,
            recent: photos.filter(p => p.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000).length,
            location: photos.filter(p => p.location).length,
          }}
        />
      )}

      <div className="photo-gallery__grid" role="list" aria-label="Photo gallery">
        {visiblePhotos.map((photo, index) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            index={index}
            onClick={() => onPhotoClick?.(photo)}
            onDelete={() => onDelete?.(photo.id)}
            onFavorite={() => onFavorite?.(photo.id)}
            isLazy
          />
        ))}
      </div>

      {visibleRange.end < filteredPhotos.length && (
        <div className="photo-gallery__load-more">
          <button
            onClick={() => setVisibleRange(prev => ({
              ...prev,
              end: Math.min(prev.end + 20, filteredPhotos.length),
            }))}
            className="btn btn--secondary"
          >
            Load More ({filteredPhotos.length - visibleRange.end} remaining)
          </button>
        </div>
      )}
    </div>
  );
};

export default PhotoGallery;