import React, { useState, useEffect, useCallback } from 'react';
import './PhotoSlideshow.css';

const TRANSITIONS = [
  { id: 'fade', label: 'Fade' },
  { id: 'slide', label: 'Slide' },
  { id: 'zoom', label: 'Zoom' },
  { id: 'flip', label: 'Flip' },
];

const INTERVALS = [
  { value: 2000, label: '2 sec' },
  { value: 3000, label: '3 sec' },
  { value: 5000, label: '5 sec' },
  { value: 8000, label: '8 sec' },
];

function PhotoSlideshow({ photos }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transition, setTransition] = useState('fade');
  const [interval, setIntervalMs] = useState(3000);
  const [showControls, setShowControls] = useState(true);
  const [filterTag, setFilterTag] = useState('');

  const allTags = [...new Set(photos.flatMap((p) => p.tags || []))].sort();
  const slideshowPhotos = filterTag
    ? photos.filter((p) => (p.tags || []).includes(filterTag))
    : photos;

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % slideshowPhotos.length);
  }, [slideshowPhotos.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + slideshowPhotos.length) % slideshowPhotos.length);
  }, [slideshowPhotos.length]);

  // Auto-advance
  useEffect(() => {
    if (!isPlaying || slideshowPhotos.length <= 1) return;
    const timer = setInterval(goNext, interval);
    return () => clearInterval(timer);
  }, [isPlaying, interval, goNext, slideshowPhotos.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === ' ') setIsPlaying((p) => !p);
      if (e.key === 'Escape') setIsPlaying(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev]);

  if (photos.length === 0) {
    return (
      <div className="slideshow-empty">
        <span>▶️</span>
        <p>No photos available for slideshow.</p>
      </div>
    );
  }

  const currentPhoto = slideshowPhotos[currentIndex];

  return (
    <div className="photo-slideshow">
      <div className="slideshow-header">
        <h2>Photo Slideshow</h2>
        <div className="slideshow-settings">
          {allTags.length > 0 && (
            <select
              className="slideshow-select"
              value={filterTag}
              onChange={(e) => {
                setFilterTag(e.target.value);
                setCurrentIndex(0);
              }}
              aria-label="Filter slideshow by tag"
            >
              <option value="">All Photos</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  #{tag}
                </option>
              ))}
            </select>
          )}
          <select
            className="slideshow-select"
            value={transition}
            onChange={(e) => setTransition(e.target.value)}
            aria-label="Transition effect"
          >
            {TRANSITIONS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <select
            className="slideshow-select"
            value={interval}
            onChange={(e) => setIntervalMs(Number(e.target.value))}
            aria-label="Slide interval"
          >
            {INTERVALS.map((i) => (
              <option key={i.value} value={i.value}>
                {i.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {slideshowPhotos.length === 0 ? (
        <div className="slideshow-empty">
          <p>No photos match the selected filter.</p>
        </div>
      ) : (
        <div
          className="slideshow-stage"
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => isPlaying && setShowControls(false)}
        >
          <div className={`slide transition-${transition}`} key={currentPhoto?.id}>
            <img
              src={currentPhoto?.dataUrl}
              alt={currentPhoto?.fileName}
              className="slide-image"
            />
            <div className="slide-overlay">
              <p className="slide-filename">{currentPhoto?.fileName}</p>
              <p className="slide-date">
                {currentPhoto && new Date(currentPhoto.uploadDate).toLocaleDateString()}
              </p>
              {currentPhoto?.location && (
                <p className="slide-location">📍 {currentPhoto.location.name}</p>
              )}
            </div>
          </div>

          {/* Navigation */}
          {showControls && (
            <>
              <button className="slide-nav prev" onClick={goPrev} aria-label="Previous">
                ‹
              </button>
              <button className="slide-nav next" onClick={goNext} aria-label="Next">
                ›
              </button>
            </>
          )}

          {/* Progress dots */}
          <div className="slide-dots">
            {slideshowPhotos.map((_, i) => (
              <button
                key={i}
                className={`dot ${i === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="slideshow-controls">
        <button className="control-btn" onClick={goPrev} aria-label="Previous slide">
          ⏮
        </button>
        <button
          className={`play-btn ${isPlaying ? 'playing' : ''}`}
          onClick={() => setIsPlaying((p) => !p)}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶️'} {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button className="control-btn" onClick={goNext} aria-label="Next slide">
          ⏭
        </button>
        <span className="slide-counter">
          {slideshowPhotos.length > 0 ? currentIndex + 1 : 0} / {slideshowPhotos.length}
        </span>
      </div>
    </div>
  );
}

export default PhotoSlideshow;
