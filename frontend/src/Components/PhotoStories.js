import React, { useState, useEffect, useCallback, useRef } from 'react';

const TRANSITION_DURATION = 600; // ms
const DEFAULT_SLIDE_INTERVAL = 4000; // ms

function StorySlide({ photo, caption, isActive, transitionStyle }) {
  return (
    <div
      style={{
        position: 'absolute', inset: 0,
        opacity: isActive ? 1 : 0,
        transition: `opacity ${TRANSITION_DURATION}ms ease`,
        pointerEvents: isActive ? 'auto' : 'none',
        ...transitionStyle,
      }}
    >
      <img
        src={photo}
        alt={caption || 'Story slide'}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      {caption && (
        <div
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '32px 20px 20px',
            background: 'linear-gradient(transparent, rgba(0,0,0,0.65))',
            color: '#fff', fontSize: 16, fontWeight: 500,
          }}
        >
          {caption}
        </div>
      )}
    </div>
  );
}

function ProgressBar({ count, current, intervalMs, isPlaying }) {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '8px 12px', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.35)', borderRadius: 2, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%', borderRadius: 2, background: '#fff',
              width: i < current ? '100%' : i === current && isPlaying ? '100%' : '0%',
              transition: i === current && isPlaying ? `width ${intervalMs}ms linear` : 'none',
            }}
          />
        </div>
      ))}
    </div>
  );
}

export default function PhotoStories() {
  const [slides, setSlides] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [intervalMs] = useState(DEFAULT_SLIDE_INTERVAL);
  const [editingCaption, setEditingCaption] = useState(null);
  const [captionDraft, setCaptionDraft] = useState('');
  const photoInputRef = useRef(null);
  const timerRef = useRef(null);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1 < slides.length ? prev + 1 : 0));
  }, [slides.length]);

  const goPrev = () => {
    setCurrentIndex((prev) => (prev - 1 >= 0 ? prev - 1 : slides.length - 1));
  };

  useEffect(() => {
    if (!isPlaying || slides.length === 0) return;
    timerRef.current = setTimeout(goNext, intervalMs);
    return () => clearTimeout(timerRef.current);
  }, [isPlaying, currentIndex, goNext, intervalMs, slides.length]);

  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files);
    const newSlides = files.map((f) => ({ photo: URL.createObjectURL(f), caption: '' }));
    setSlides((prev) => [...prev, ...newSlides]);
    setIsPlaying(false);
    e.target.value = '';
  };

  const handleRemoveSlide = (index) => {
    setSlides((prev) => prev.filter((_, i) => i !== index));
    setCurrentIndex((prev) => Math.min(prev, Math.max(0, slides.length - 2)));
  };

  const handleStartEditCaption = (index) => {
    setEditingCaption(index);
    setCaptionDraft(slides[index].caption);
  };

  const handleSaveCaption = () => {
    setSlides((prev) =>
      prev.map((s, i) => (i === editingCaption ? { ...s, caption: captionDraft } : s))
    );
    setEditingCaption(null);
  };

  const togglePlay = () => {
    if (slides.length === 0) return;
    setIsPlaying((p) => !p);
  };

  if (slides.length === 0) {
    return (
      <div style={{ maxWidth: 400, margin: '0 auto', padding: 24, fontFamily: 'sans-serif' }}>
        <h2 style={{ marginBottom: 16 }}>Photo Stories</h2>
        <div
          onClick={() => photoInputRef.current && photoInputRef.current.click()}
          style={{
            border: '2px dashed #a5b4fc', borderRadius: 12, padding: 56,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 12, cursor: 'pointer', background: '#f5f3ff',
          }}
        >
          <span style={{ fontSize: 44 }}>📷</span>
          <span style={{ color: '#6366f1', fontWeight: 600 }}>Add photos to create your story</span>
        </div>
        <input ref={photoInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFilesChange} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: 24, fontFamily: 'sans-serif' }}>
      <h2 style={{ marginBottom: 16 }}>Photo Stories</h2>

      {/* Story Viewer */}
      <div
        style={{
          position: 'relative', borderRadius: 16, overflow: 'hidden',
          aspectRatio: '9/16', maxHeight: 480, background: '#111', marginBottom: 16,
        }}
      >
        <ProgressBar count={slides.length} current={currentIndex} intervalMs={intervalMs} isPlaying={isPlaying} />

        {slides.map((slide, i) => (
          <StorySlide key={i} photo={slide.photo} caption={slide.caption} isActive={i === currentIndex} />
        ))}

        {/* Tap zones */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', zIndex: 5 }}>
          <div style={{ flex: 1 }} onClick={goPrev} />
          <div style={{ flex: 1 }} onClick={goNext} />
        </div>

        {/* Controls overlay */}
        <div style={{ position: 'absolute', bottom: 12, right: 12, display: 'flex', gap: 8, zIndex: 10 }}>
          <button
            onClick={togglePlay}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(0,0,0,0.5)', color: '#fff',
              border: 'none', cursor: 'pointer', fontSize: 16,
            }}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
        </div>
      </div>

      {/* Slide counter */}
      <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 13, margin: '0 0 12px' }}>
        {currentIndex + 1} / {slides.length}
      </p>

      {/* Caption editor */}
      {editingCaption === currentIndex ? (
        <div style={{ marginBottom: 14, display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={captionDraft}
            onChange={(e) => setCaptionDraft(e.target.value)}
            placeholder="Add a caption…"
            style={{ flex: 1, padding: '8px 10px', border: '1px solid #6366f1', borderRadius: 6, fontSize: 14 }}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveCaption()}
            autoFocus
          />
          <button
            onClick={handleSaveCaption}
            style={{
              padding: '8px 14px', background: '#6366f1', color: '#fff',
              border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600,
            }}
          >
            Save
          </button>
        </div>
      ) : (
        <button
          onClick={() => handleStartEditCaption(currentIndex)}
          style={{
            display: 'block', width: '100%', textAlign: 'left',
            padding: '8px 10px', marginBottom: 14,
            border: '1px solid #e5e7eb', borderRadius: 6,
            background: '#fff', cursor: 'pointer', fontSize: 13, color: '#6b7280',
          }}
        >
          {slides[currentIndex].caption || '✏️ Add caption to this slide…'}
        </button>
      )}

      {/* Thumbnail strip */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 14 }}>
        {slides.map((slide, i) => (
          <div
            key={i}
            onClick={() => { setCurrentIndex(i); setIsPlaying(false); }}
            style={{
              position: 'relative', flexShrink: 0,
              width: 54, height: 54, borderRadius: 8, overflow: 'hidden',
              border: i === currentIndex ? '2px solid #6366f1' : '2px solid transparent',
              cursor: 'pointer',
            }}
          >
            <img src={slide.photo} alt={`Slide ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button
              aria-label="Remove slide"
              onClick={(e) => { e.stopPropagation(); handleRemoveSlide(i); }}
              style={{
                position: 'absolute', top: 1, right: 1,
                background: 'rgba(0,0,0,0.55)', color: '#fff',
                border: 'none', borderRadius: '50%',
                width: 16, height: 16, fontSize: 10, cursor: 'pointer', lineHeight: '16px', padding: 0,
              }}
            >
              ×
            </button>
          </div>
        ))}
        <div
          onClick={() => photoInputRef.current && photoInputRef.current.click()}
          style={{
            flexShrink: 0, width: 54, height: 54, borderRadius: 8,
            border: '2px dashed #a5b4fc', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', background: '#f5f3ff',
          }}
        >
          <span style={{ fontSize: 22, color: '#6366f1' }}>＋</span>
        </div>
      </div>

      <input ref={photoInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFilesChange} />
    </div>
  );
}
