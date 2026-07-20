import React, { useState, useEffect, useRef } from 'react';
import { createMoodPlayer } from '../../utils/storyMusic';
import './PhotoStories.css';

const MUSIC_OPTIONS = [
  { id: 'none', label: 'No Music' },
  { id: 'upbeat', label: '🎵 Upbeat' },
  { id: 'calm', label: '🎶 Calm' },
  { id: 'nostalgic', label: '🎸 Nostalgic' },
  { id: 'energetic', label: '⚡ Energetic' },
];

function PhotoStories({ photos }) {
  const [storyTitle, setStoryTitle] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [captions, setCaptions] = useState({});
  const [music, setMusic] = useState('none');
  const [playing, setPlaying] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const playerRef = useRef(null);

  useEffect(() => {
    if (playing && music !== 'none') {
      playerRef.current = createMoodPlayer(music);
    }
    return () => {
      if (playerRef.current) {
        playerRef.current.stop();
        playerRef.current = null;
      }
    };
  }, [playing, music]);

  const togglePhotoSelection = (photo) => {
    setSelectedPhotos((prev) => {
      const exists = prev.find((p) => p.id === photo.id);
      if (exists) {
        return prev.filter((p) => p.id !== photo.id);
      }
      return [...prev, photo];
    });
  };

  const updateCaption = (photoId, text) => {
    setCaptions((prev) => ({ ...prev, [photoId]: text }));
  };

  const startStory = () => {
    if (selectedPhotos.length === 0) return;
    setCurrentSlide(0);
    setPlaying(true);
  };

  const nextSlide = () => {
    if (currentSlide < selectedPhotos.length - 1) {
      setCurrentSlide((s) => s + 1);
    } else {
      setPlaying(false);
      setCurrentSlide(0);
    }
  };

  const prevSlide = () => {
    setCurrentSlide((s) => Math.max(0, s - 1));
  };

  const exitStory = () => {
    setPlaying(false);
    setCurrentSlide(0);
  };

  if (playing && selectedPhotos.length > 0) {
    const currentPhoto = selectedPhotos[currentSlide];
    const caption = captions[currentPhoto.id] || '';

    return (
      <div className="story-player">
        <button className="story-exit" onClick={exitStory}>
          ✕ Exit Story
        </button>
        <div className="story-progress">
          {selectedPhotos.map((_, i) => (
            <div
              key={i}
              className={`progress-segment ${i <= currentSlide ? 'filled' : ''}`}
            />
          ))}
        </div>
        <div className="story-slide">
          <img
            src={currentPhoto.dataUrl}
            alt={currentPhoto.fileName}
            className="story-image"
          />
          {caption && (
            <div className="story-caption">
              <p>{caption}</p>
            </div>
          )}
          <div className="story-nav">
            <button
              className="story-nav-btn"
              onClick={prevSlide}
              disabled={currentSlide === 0}
            >
              ← Prev
            </button>
            <span className="story-counter">
              {currentSlide + 1} / {selectedPhotos.length}
            </span>
            <button className="story-nav-btn" onClick={nextSlide}>
              {currentSlide === selectedPhotos.length - 1 ? 'Finish' : 'Next →'}
            </button>
          </div>
        </div>
        {music !== 'none' && (
          <div className="story-music-indicator">
            🎵 {MUSIC_OPTIONS.find((m) => m.id === music)?.label}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="photo-stories">
      <h2>Photo Stories</h2>
      <p className="stories-description">
        Combine your photos with captions and background music to create a story.
      </p>

      <div className="stories-builder">
        {/* Title */}
        <div className="story-section">
          <label className="story-label" htmlFor="story-title">
            Story Title
          </label>
          <input
            id="story-title"
            type="text"
            className="story-title-input"
            value={storyTitle}
            onChange={(e) => setStoryTitle(e.target.value)}
            placeholder="Give your story a title..."
          />
        </div>

        {/* Music */}
        <div className="story-section">
          <label className="story-label">Background Music</label>
          <div className="music-options">
            {MUSIC_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                className={`music-btn ${music === opt.id ? 'active' : ''}`}
                onClick={() => setMusic(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Photo selection */}
        <div className="story-section">
          <label className="story-label">
            Select Photos ({selectedPhotos.length} selected)
          </label>
          {photos.length === 0 ? (
            <p className="no-photos-hint">Upload photos to add them to your story.</p>
          ) : (
            <div className="story-photo-grid">
              {photos.map((photo) => {
                const isSelected = selectedPhotos.some((p) => p.id === photo.id);
                const selectionIndex = selectedPhotos.findIndex((p) => p.id === photo.id);
                return (
                  <div
                    key={photo.id}
                    className={`story-photo-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => togglePhotoSelection(photo)}
                  >
                    <img
                      src={photo.thumbnail || photo.dataUrl}
                      alt={photo.fileName}
                      className="story-photo-thumb"
                    />
                    {isSelected && (
                      <span className="selection-badge">{selectionIndex + 1}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Captions */}
        {selectedPhotos.length > 0 && (
          <div className="story-section">
            <label className="story-label">Add Captions</label>
            <div className="captions-list">
              {selectedPhotos.map((photo, index) => (
                <div key={photo.id} className="caption-item">
                  <img
                    src={photo.thumbnail || photo.dataUrl}
                    alt={photo.fileName}
                    className="caption-thumb"
                  />
                  <div className="caption-input-wrap">
                    <span className="caption-index">{index + 1}</span>
                    <input
                      type="text"
                      className="caption-input"
                      value={captions[photo.id] || ''}
                      onChange={(e) => updateCaption(photo.id, e.target.value)}
                      placeholder="Add a caption for this photo..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          className="start-story-btn"
          onClick={startStory}
          disabled={selectedPhotos.length === 0}
        >
          ▶️ Play Story ({selectedPhotos.length} photos)
        </button>
      </div>
    </div>
  );
}

export default PhotoStories;
