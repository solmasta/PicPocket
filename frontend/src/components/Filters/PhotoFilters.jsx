import React, { useState, useRef, useEffect } from 'react';
import {
  FILTERS,
  FILTER_LABELS,
  getCSSFilter,
  applyFilterToImage,
} from '../../utils/imageFilters';
import TagManager from '../Tags/TagManager';
import './PhotoFilters.css';

function PhotoFilters({ photo, onSave, onViewChange }) {
  const [selectedFilter, setSelectedFilter] = useState(photo?.filter || FILTERS.NONE);
  const [intensity, setIntensity] = useState(1);
  const [tags, setTags] = useState(photo?.tags || []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (photo) {
      setSelectedFilter(photo.filter || FILTERS.NONE);
      setTags(photo.tags || []);
      setSaved(false);
    }
  }, [photo]);

  if (!photo) {
    return (
      <div className="filters-empty">
        <div className="filters-empty__icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </div>
        <p>Select a photo from the gallery to apply filters.</p>
        <button className="btn-primary" onClick={() => onViewChange('gallery')}>
          Go to Gallery
        </button>
      </div>
    );
  }

  const filterStyle =
    selectedFilter === FILTERS.NONE ? {} : { filter: getCSSFilter(selectedFilter, intensity) };

  const handleApply = async () => {
    setSaving(true);
    try {
      let newDataUrl = photo.dataUrl;
      if (selectedFilter !== FILTERS.NONE && imgRef.current) {
        newDataUrl = await applyFilterToImage(imgRef.current, selectedFilter, intensity);
      }
      const updatedPhoto = {
        ...photo,
        dataUrl: newDataUrl,
        filter: selectedFilter,
        tags,
      };
      await onSave(updatedPhoto);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save photo:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="photo-filters">
      <h2>Edit Photo</h2>

      <div className="filters-layout">
        <div className="filter-preview-wrap">
          <img
            ref={imgRef}
            src={photo.dataUrl}
            alt={photo.fileName}
            className="filter-preview-img"
            style={filterStyle}
            crossOrigin="anonymous"
          />
          <div className="preview-info">
            <span className="preview-info__name">{photo.fileName}</span>
            <span className="preview-info__date">{new Date(photo.uploadDate).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="filter-controls">
          <div className="filter-section">
            <h3>Filters</h3>
            <div className="filter-grid">
              {Object.values(FILTERS).map((filterName) => (
                <button
                  key={filterName}
                  className={`filter-option ${selectedFilter === filterName ? 'active' : ''}`}
                  onClick={() => setSelectedFilter(filterName)}
                >
                  <div
                    className="filter-thumb-wrap"
                    style={
                      filterName !== FILTERS.NONE
                        ? { filter: getCSSFilter(filterName, 1) }
                        : {}
                    }
                  >
                    <img
                      src={photo.thumbnail || photo.dataUrl}
                      alt={FILTER_LABELS[filterName]}
                      className="filter-thumb"
                    />
                  </div>
                  <span>{FILTER_LABELS[filterName]}</span>
                </button>
              ))}
            </div>
          </div>

          {selectedFilter !== FILTERS.NONE && (
            <div className="filter-section">
              <h3>Intensity</h3>
              <div className="intensity-control">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={intensity}
                  onChange={(e) => setIntensity(Number(e.target.value))}
                  className="intensity-slider"
                  aria-label="Filter intensity"
                />
                <span className="intensity-value">{Math.round(intensity * 100)}%</span>
              </div>
            </div>
          )}

          <div className="filter-section">
            <h3>Tags</h3>
            <TagManager tags={tags} onChange={setTags} />
          </div>

          <button
            className={`save-btn ${saved ? 'saved' : ''}`}
            onClick={handleApply}
            disabled={saving}
          >
            {saved ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Saved!
              </>
            ) : saving ? (
              <>
                <div className="save-btn__spinner" />
                Saving...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PhotoFilters;