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

  useEffect(() => {
    if (initialValue) {
      loadSuggestions(initialValue);
    }
  }, [initialValue]);

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

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

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
      <div className="search-bar-wrapper">
        <svg className="search-bar-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
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
        {query && (
          <button
            className="search-bar-clear"
            onClick={handleClear}
            aria-label="Clear search"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {showSuggestions && isLoading && (
        <div className="search-suggestions search-suggestions--loading">
          <div className="search-suggestions__spinner" />
          <span>Searching…</span>
        </div>
      )}

      {showSuggestions && !isLoading && suggestions.length > 0 && (
        <div className="search-suggestions">
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.id}-${index}`}
              className="suggestion-item"
              onClick={() => handleSuggestionClick(suggestion)}
              role="option"
            >
              <div className="suggestion-item__content">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
                <span className="suggestion-item__text">
                  {suggestion.tags.join(', ')}
                </span>
              </div>
              <span className="suggestion-item__count">
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