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
        <span>✨</span>
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
        {/* Preview */}
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
            <span>{photo.fileName}</span>
            <span>{new Date(photo.uploadDate).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Controls */}
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
            {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PhotoFilters;
