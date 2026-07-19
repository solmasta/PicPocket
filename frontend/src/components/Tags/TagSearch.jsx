import React, { useState, useMemo } from 'react';
import PhotoCard from '../Gallery/PhotoCard';
import './TagSearch.css';

function TagSearch({ photos, onSelect }) {
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  const allTags = useMemo(() => {
    const tagMap = {};
    photos.forEach((photo) => {
      (photo.tags || []).forEach((tag) => {
        tagMap[tag] = (tagMap[tag] || 0) + 1;
      });
    });
    return Object.entries(tagMap)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }));
  }, [photos]);

  const filteredPhotos = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filterByTag = selectedTag
      ? photos.filter((p) => (p.tags || []).includes(selectedTag))
      : photos;

    if (!q) return filterByTag;

    return filterByTag.filter(
      (p) =>
        (p.tags || []).some((t) => t.includes(q)) ||
        p.fileName.toLowerCase().includes(q) ||
        (p.location?.name || '').toLowerCase().includes(q)
    );
  }, [photos, query, selectedTag]);

  return (
    <div className="tag-search">
      <h2>Search by Tags</h2>

      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by tag, file name, or location..."
          aria-label="Search photos"
        />
        {query && (
          <button className="clear-search" onClick={() => setQuery('')} aria-label="Clear search">
            ✕
          </button>
        )}
      </div>

      {/* Tag cloud */}
      {allTags.length > 0 && (
        <div className="tag-cloud">
          <button
            className={`tag-cloud-item ${selectedTag === '' ? 'active' : ''}`}
            onClick={() => setSelectedTag('')}
          >
            All Photos ({photos.length})
          </button>
          {allTags.map(({ tag, count }) => (
            <button
              key={tag}
              className={`tag-cloud-item ${selectedTag === tag ? 'active' : ''}`}
              onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
            >
              #{tag} ({count})
            </button>
          ))}
        </div>
      )}

      <div className="search-results-header">
        <span>{filteredPhotos.length} result{filteredPhotos.length !== 1 ? 's' : ''}</span>
      </div>

      {filteredPhotos.length === 0 ? (
        <div className="no-results">
          <span>🔍</span>
          <p>No photos found matching your search.</p>
        </div>
      ) : (
        <div className="search-results-grid">
          {filteredPhotos.map((photo) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              onSelect={onSelect}
              onDelete={() => {}}
              viewMode="grid"
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default TagSearch;
