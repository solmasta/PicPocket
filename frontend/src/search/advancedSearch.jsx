/**
 * Advanced Search Component
 * AI-powered photo recognition and intelligent search
 * Multi-criteria filtering with semantic search capabilities
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './advancedSearch.css';

const AdvancedSearch = ({ photos, onSearch, onFiltersChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState({
    tags: [],
    dateRange: { start: null, end: null },
    location: '',
    orientation: '',
    quality: '',
    size: '',
    color: '',
    contentType: '',
    aiTags: [],
    customFilters: []
  });
  const [suggestions, setSuggestions] = useState([]);
  const [isAISearchEnabled, setIsAISearchEnabled] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // AI-powered content analysis
  const analyzePhotoContent = useCallback(async (photo) => {
    if (!isAISearchEnabled) return null;

    try {
      // Simulate AI analysis - in real app, this would call ML service
      const analysis = await simulateAIAnalysis(photo);
      return analysis;
    } catch (error) {
      console.error('AI analysis failed:', error);
      return null;
    }
  }, [isAISearchEnabled]);

  // Simulate AI photo analysis
  const simulateAIAnalysis = async (photo) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const categories = ['nature', 'people', 'architecture', 'food', 'animals', 'technology', 'art', 'sports'];
    const colors = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'black', 'white'];
    const moods = ['happy', 'sad', 'energetic', 'calm', 'dramatic', 'peaceful'];
    
    return {
      categories: categories.sort(() => Math.random() - 0.5).slice(0, 2),
      colors: colors.sort(() => Math.random() - 0.5).slice(0, 3),
      moods: moods.sort(() => Math.random() - 0.5).slice(0, 1),
      objects: generateRandomObjects(),
      quality: calculateImageQuality(photo),
      composition: analyzeComposition(photo)
    };
  };

  const generateRandomObjects = () => {
    const objects = ['tree', 'building', 'car', 'person', 'animal', 'sky', 'water', 'mountain', 'flower', 'food'];
    return objects.sort(() => Math.random() - 0.5).slice(0, 2);
  };

  const calculateImageQuality = (photo) => {
    // Simulate quality calculation based on metadata
    const score = Math.random() * 100;
    return {
      overall: score,
      sharpness: score * 0.8,
      exposure: score * 0.9,
      color: score * 0.85
    };
  };

  const analyzeComposition = (photo) => {
    // Simulate composition analysis
    return {
      ruleOfThirds: Math.random() > 0.5,
      symmetry: Math.random() > 0.7,
      leadingLines: Math.random() > 0.6,
      framing: Math.random() > 0.8
    };
  };

  // Enhanced search with AI-powered matching
  const performSearch = useCallback(async (query, filters = searchFilters) => {
    setIsSearching(true);
    
    try {
      let filteredPhotos = [...photos];

      // Text-based search with semantic matching
      if (query.trim()) {
        filteredPhotos = filteredPhotos.filter(photo => {
          const searchText = `${photo.name} ${photo.description || ''} ${photo.tags?.join(' ') || ''}`.toLowerCase();
          const searchTerms = query.toLowerCase().split(' ');
          
          return searchTerms.some(term => 
            searchText.includes(term) ||
            calculateSemanticSimilarity(searchText, term) > 0.7
          );
        });
      }

      // AI-powered content search
      if (isAISearchEnabled && filters.aiTags.length > 0) {
        const photosWithAI = await Promise.all(
          filteredPhotos.map(async photo => ({
            ...photo,
            aiAnalysis: await analyzePhotoContent(photo)
          }))
        );

        filteredPhotos = photosWithAI.filter(photo => {
          if (!photo.aiAnalysis) return true;
          
          return filters.aiTags.every(aiTag => {
            switch (aiTag.type) {
              case 'category':
                return photo.aiAnalysis.categories.includes(aiTag.value);
              case 'color':
                return photo.aiAnalysis.colors.includes(aiTag.value);
              case 'mood':
                return photo.aiAnalysis.moods.includes(aiTag.value);
              case 'object':
                return photo.aiAnalysis.objects.includes(aiTag.value);
              default:
                return true;
            }
          });
        });
      }

      // Apply traditional filters
      filteredPhotos = applyTraditionalFilters(filteredPhotos, filters);

      // Sort by relevance
      filteredPhotos = sortPhotosByRelevance(filteredPhotos, query, filters);

      // Save to search history
      if (query.trim()) {
        setSearchHistory(prev => [
          { query, timestamp: Date.now(), resultCount: filteredPhotos.length },
          ...prev.slice(0, 9) // Keep last 10 searches
        ]);
      }

      onSearch(filteredPhotos);
      
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  }, [photos, isAISearchEnabled, searchFilters, onSearch, analyzePhotoContent]);

  // Calculate semantic similarity
  const calculateSemanticSimilarity = (text1, text2) => {
    // Simple similarity calculation - in real app, use word embeddings or ML model
    const words1 = text1.split(' ');
    const words2 = text2.split(' ');
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    return intersection.length / union.length;
  };

  // Apply traditional filters
  const applyTraditionalFilters = (photos, filters) => {
    return photos.filter(photo => {
      // Tag filter
      if (filters.tags.length > 0) {
        const photoTags = photo.tags || [];
        if (!filters.tags.every(tag => photoTags.includes(tag))) {
          return false;
        }
      }

      // Date range filter
      if (filters.dateRange.start || filters.dateRange.end) {
        const photoDate = new Date(photo.createdAt);
        if (filters.dateRange.start && photoDate < new Date(filters.dateRange.start)) {
          return false;
        }
        if (filters.dateRange.end && photoDate > new Date(filters.dateRange.end)) {
          return false;
        }
      }

      // Location filter
      if (filters.location) {
        const photoLocation = (photo.location || '').toLowerCase();
        if (!photoLocation.includes(filters.location.toLowerCase())) {
          return false;
        }
      }

      // Orientation filter
      if (filters.orientation && photo.metadata?.orientation !== filters.orientation) {
        return false;
      }

      // Quality filter
      if (filters.quality) {
        const quality = photo.metadata?.quality || 'medium';
        if (filters.quality === 'high' && quality !== 'high') return false;
        if (filters.quality === 'medium' && !['high', 'medium'].includes(quality)) return false;
      }

      // Size filter
      if (filters.size) {
        const fileSize = photo.metadata?.fileSize || 0;
        switch (filters.size) {
          case 'small':
            if (fileSize > 1024 * 1024) return false; // < 1MB
            break;
          case 'medium':
            if (fileSize < 1024 * 1024 || fileSize > 10 * 1024 * 1024) return false; // 1-10MB
            break;
          case 'large':
            if (fileSize < 10 * 1024 * 1024) return false; // > 10MB
            break;
        }
      }

      // Content type filter
      if (filters.contentType && photo.metadata?.contentType !== filters.contentType) {
        return false;
      }

      return true;
    });
  };

  // Sort photos by relevance
  const sortPhotosByRelevance = (photos, query, filters) => {
    return photos.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      // Text relevance
      if (query.trim()) {
        const queryTerms = query.toLowerCase().split(' ');
        scoreA += calculateRelevanceScore(a, queryTerms);
        scoreB += calculateRelevanceScore(b, queryTerms);
      }

      // Recency bonus
      const now = Date.now();
      const recencyWeight = 0.1;
      scoreA += recencyWeight * (1 - (now - new Date(a.createdAt)) / (1000 * 60 * 60 * 24 * 30)); // 30 days
      scoreB += recencyWeight * (1 - (now - new Date(b.createdAt)) / (1000 * 60 * 60 * 24 * 30));

      return scoreB - scoreA;
    });
  };

  const calculateRelevanceScore = (photo, queryTerms) => {
    let score = 0;
    const searchText = `${photo.name} ${photo.description || ''} ${photo.tags?.join(' ') || ''}`.toLowerCase();

    queryTerms.forEach(term => {
      if (searchText.includes(term)) {
        score += 1;
      }
      // Bonus for exact matches
      if (photo.name.toLowerCase().includes(term)) {
        score += 2;
      }
    });

    return score;
  };

  // Generate search suggestions
  const generateSuggestions = useCallback((query) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const allTags = [...new Set(photos.flatMap(photo => photo.tags || []))];
    const allNames = photos.map(photo => photo.name);
    const allDescriptions = photos.flatMap(photo => photo.description ? [photo.description] : []);

    const suggestions = [
      ...allTags.filter(tag => tag.toLowerCase().includes(query.toLowerCase())),
      ...allNames.filter(name => name.toLowerCase().includes(query.toLowerCase())),
      ...allDescriptions.filter(desc => desc.toLowerCase().includes(query.toLowerCase()))
    ].slice(0, 5);

    setSuggestions(suggestions);
  }, [photos]);

  // Handle search input
  const handleSearchInput = (value) => {
    setSearchQuery(value);
    generateSuggestions(value);
    
    // Debounced search
    const timeoutId = setTimeout(() => {
      performSearch(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...searchFilters, [filterType]: value };
    setSearchFilters(newFilters);
    onFiltersChange(newFilters);
    performSearch(searchQuery, newFilters);
  };

  // Save search
  const saveSearch = () => {
    const search = {
      query: searchQuery,
      filters: searchFilters,
      timestamp: Date.now(),
      name: `Search ${savedSearches.length + 1}`
    };
    
    setSavedSearches(prev => [...prev, search]);
  };

  // Load saved search
  const loadSavedSearch = (savedSearch) => {
    setSearchQuery(savedSearch.query);
    setSearchFilters(savedSearch.filters);
    performSearch(savedSearch.query, savedSearch.filters);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSearchFilters({
      tags: [],
      dateRange: { start: null, end: null },
      location: '',
      orientation: '',
      quality: '',
      size: '',
      color: '',
      contentType: '',
      aiTags: [],
      customFilters: []
    });
    onSearch(photos);
  };

  // AI tag suggestions
  const aiTagOptions = [
    { type: 'category', label: 'Nature', value: 'nature' },
    { type: 'category', label: 'People', value: 'people' },
    { type: 'category', label: 'Architecture', value: 'architecture' },
    { type: 'category', label: 'Food', value: 'food' },
    { type: 'color', label: 'Red', value: 'red' },
    { type: 'color', label: 'Blue', value: 'blue' },
    { type: 'color', label: 'Green', value: 'green' },
    { type: 'mood', label: 'Happy', value: 'happy' },
    { type: 'mood', label: 'Calm', value: 'calm' },
    { type: 'mood', label: 'Dramatic', value: 'dramatic' },
    { type: 'object', label: 'Building', value: 'building' },
    { type: 'object', label: 'Tree', value: 'tree' },
    { type: 'object', label: 'Car', value: 'car' }
  ];

  return (
    <div className="advanced-search">
      <div className="search-header">
        <div className="search-input-container">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchInput(e.target.value)}
            placeholder="Search photos by name, tags, description, or content..."
            className="search-input"
            autoFocus
          />
          {isSearching && <div className="search-spinner" />}
          
          {suggestions.length > 0 && (
            <div className="search-suggestions">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="suggestion-item"
                  onClick={() => {
                    setSearchQuery(suggestion);
                    performSearch(suggestion);
                    setSuggestions([]);
                  }}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="search-actions">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`advanced-toggle ${showAdvanced ? 'active' : ''}`}
          >
            Advanced {showAdvanced ? '▲' : '▼'}
          </button>
          <button onClick={clearFilters} className="clear-filters">Clear</button>
          <button onClick={saveSearch} className="save-search">Save</button>
        </div>
      </div>

      {showAdvanced && (
        <div className="advanced-filters">
          <div className="filter-section">
            <h4>AI-Powered Search</h4>
            <div className="ai-toggle">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={isAISearchEnabled}
                  onChange={(e) => setIsAISearchEnabled(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
              <span>Enable AI Content Analysis</span>
            </div>

            {isAISearchEnabled && (
              <div className="ai-tags">
                <div className="tag-group">
                  <h5>Categories</h5>
                  {aiTagOptions.filter(tag => tag.type === 'category').map(tag => (
                    <button
                      key={tag.value}
                      onClick={() => {
                        const aiTags = searchFilters.aiTags.filter(t => !(t.type === tag.type && t.value === tag.value));
                        if (!searchFilters.aiTags.some(t => t.type === tag.type && t.value === tag.value)) {
                          aiTags.push(tag);
                        }
                        handleFilterChange('aiTags', aiTags);
                      }}
                      className={`ai-tag ${searchFilters.aiTags.some(t => t.type === tag.type && t.value === tag.value) ? 'active' : ''}`}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>

                <div className="tag-group">
                  <h5>Colors</h5>
                  {aiTagOptions.filter(tag => tag.type === 'color').map(tag => (
                    <button
                      key={tag.value}
                      onClick={() => {
                        const aiTags = searchFilters.aiTags.filter(t => !(t.type === tag.type && t.value === tag.value));
                        if (!searchFilters.aiTags.some(t => t.type === tag.type && t.value === tag.value)) {
                          aiTags.push(tag);
                        }
                        handleFilterChange('aiTags', aiTags);
                      }}
                      className={`ai-tag color-tag ${searchFilters.aiTags.some(t => t.type === tag.type && t.value === tag.value) ? 'active' : ''}`}
                      style={{ backgroundColor: tag.value }}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>

                <div className="tag-group">
                  <h5>Moods</h5>
                  {aiTagOptions.filter(tag => tag.type === 'mood').map(tag => (
                    <button
                      key={tag.value}
                      onClick={() => {
                        const aiTags = searchFilters.aiTags.filter(t => !(t.type === tag.type && t.value === tag.value));
                        if (!searchFilters.aiTags.some(t => t.type === tag.type && t.value === tag.value)) {
                          aiTags.push(tag);
                        }
                        handleFilterChange('aiTags', aiTags);
                      }}
                      className={`ai-tag ${searchFilters.aiTags.some(t => t.type === tag.type && t.value === tag.value) ? 'active' : ''}`}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="filter-section">
            <h4>Traditional Filters</h4>
            <div className="filter-row">
              <div className="filter-group">
                <label>Tags</label>
                <select
                  multiple
                  value={searchFilters.tags}
                  onChange={(e) => handleFilterChange('tags', Array.from(e.target.selectedOptions, option => option.value))}
                  className="filter-select"
                >
                  {[...new Set(photos.flatMap(photo => photo.tags || []))].map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Location</label>
                <input
                  type="text"
                  value={searchFilters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  placeholder="Filter by location..."
                  className="filter-input"
                />
              </div>

              <div className="filter-group">
                <label>Orientation</label>
                <select
                  value={searchFilters.orientation}
                  onChange={(e) => handleFilterChange('orientation', e.target.value)}
                  className="filter-select"
                >
                  <option value="">All</option>
                  <option value="landscape">Landscape</option>
                  <option value="portrait">Portrait</option>
                  <option value="square">Square</option>
                </select>
              </div>
            </div>

            <div className="filter-row">
              <div className="filter-group">
                <label>Quality</label>
                <select
                  value={searchFilters.quality}
                  onChange={(e) => handleFilterChange('quality', e.target.value)}
                  className="filter-select"
                >
                  <option value="">All</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div className="filter-group">
                <label>File Size</label>
                <select
                  value={searchFilters.size}
                  onChange={(e) => handleFilterChange('size', e.target.value)}
                  className="filter-select"
                >
                  <option value="">All</option>
                  <option value="small">Small (&lt; 1MB)</option>
                  <option value="medium">Medium (1-10MB)</option>
                  <option value="large">Large (&gt; 10MB)</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Content Type</label>
                <select
                  value={searchFilters.contentType}
                  onChange={(e) => handleFilterChange('contentType', e.target.value)}
                  className="filter-select"
                >
                  <option value="">All</option>
                  <option value="image/jpeg">JPEG</option>
                  <option value="image/png">PNG</option>
                  <option value="image/webp">WebP</option>
                  <option value="image/gif">GIF</option>
                </select>
              </div>
            </div>

            <div className="filter-row">
              <div className="filter-group">
                <label>Date Range</label>
                <div className="date-range">
                  <input
                    type="date"
                    value={searchFilters.dateRange.start || ''}
                    onChange={(e) => handleFilterChange('dateRange', { ...searchFilters.dateRange, start: e.target.value })}
                    className="filter-input"
                  />
                  <span>to</span>
                  <input
                    type="date"
                    value={searchFilters.dateRange.end || ''}
                    onChange={(e) => handleFilterChange('dateRange', { ...searchFilters.dateRange, end: e.target.value })}
                    className="filter-input"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {(searchHistory.length > 0 || savedSearches.length > 0) && (
        <div className="search-history">
          {searchHistory.length > 0 && (
            <div className="history-section">
              <h4>Recent Searches</h4>
              <div className="history-items">
                {searchHistory.map((item, index) => (
                  <div
                    key={index}
                    className="history-item"
                    onClick={() => {
                      setSearchQuery(item.query);
                      performSearch(item.query);
                    }}
                  >
                    <span className="history-query">{item.query}</span>
                    <span className="history-count">{item.resultCount} results</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {savedSearches.length > 0 && (
            <div className="history-section">
              <h4>Saved Searches</h4>
              <div className="history-items">
                {savedSearches.map((search, index) => (
                  <div
                    key={index}
                    className="history-item saved"
                    onClick={() => loadSavedSearch(search)}
                  >
                    <span className="history-name">{search.name}</span>
                    <span className="history-query">{search.query || 'Filters only'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;