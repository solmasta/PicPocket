import React, { useState, useEffect, useRef } from 'react';
import { searchPhotos } from '../../utils/indexedDB';
import './SearchBar.css';

function SearchBar({ onSearch, onClear, initialValue = '' }) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  // Load initial suggestions
  useEffect(() => {
    if (query) {
      loadSuggestions(query);
    }
  }, []);

  const loadSuggestions = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const results = await searchPhotos(searchQuery, 5);
      setSuggestions(results);
    } catch (error) {
      console.error('Error loading suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(true);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout
    if (value.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        loadSuggestions(value);
      }, 300);
    } else {
      setSuggestions([]);
    }
  };

  const handleSearch = (searchQuery = query) => {
    onSearch(searchQuery);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.tags.join(', '));
    handleSearch(suggestion.tags.join(', '));
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    onClear();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="search-bar-container">
      <input
        ref={inputRef}
        type="text"
        className="search-bar"
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setShowSuggestions(true)}
        placeholder="Search by tags, location, or filename..."
        aria-label="Search photos"
      />
      <span className="search-bar-icon">🔍</span>
      
      {query && (
        <button
          className="clear-search"
          onClick={handleClear}
          aria-label="Clear search"
        >
          ✕
        </button>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div className="search-suggestions">
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.id}-${index}`}
              className="suggestion-item"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <span className="suggestion-text">
                {suggestion.tags.join(', ')}
              </span>
              <span className="suggestion-count">
                {suggestion.count || 1}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchBar;