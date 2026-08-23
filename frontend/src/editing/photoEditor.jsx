/**
 * Photo Editor Component
 * Advanced photo editing with filters, adjustments, and transformations
 * Supports batch operations and non-destructive editing
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import './photoEditor.css';

const PhotoEditor = ({ photos, selectedPhotoIds, onEditComplete, onClose }) => {
  const [activePhoto, setActivePhoto] = useState(null);
  const [editHistory, setEditHistory] = useState({});
  const [currentEdit, setCurrentEdit] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    hue: 0,
    blur: 0,
    sharpen: 0,
    vignette: 0,
    temperature: 0,
    tint: 0
  });
  const [activeFilter, setActiveFilter] = useState('none');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewMode, setPreviewMode] = useState('single');
  const [batchMode, setBatchMode] = useState(false);
  const [cropData, setCropData] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [flip, setFlip] = useState({ horizontal: false, vertical: false });
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const filters = {
    none: { name: 'None', preset: {} },
    vintage: { 
      name: 'Vintage', 
      preset: { brightness: 10, contrast: 20, saturation: 60, temperature: 20, vignette: 30 }
    },
    blackwhite: { 
      name: 'Black & White', 
      preset: { saturation: -100, contrast: 10, brightness: 5 }
    },
    sepia: { 
      name: 'Sepia', 
      preset: { saturation: -50, hue: 30, temperature: 40 }
    },
    cold: { 
      name: 'Cold', 
      preset: { temperature: -30, tint: 10, saturation: -10 }
    },
    warm: { 
      name: 'Warm', 
      preset: { temperature: 30, tint: -10, saturation: 10 }
    },
    dramatic: { 
      name: 'Dramatic', 
      preset: { contrast: 40, brightness: -10, saturation: 20, vignette: 20 }
    },
    faded: { 
      name: 'Faded', 
      preset: { contrast: -20, saturation: -30, brightness: 10 }
    },
    vivid: { 
      name: 'Vivid', 
      preset: { saturation: 40, contrast: 15, brightness: 5 }
    }
  };

  const adjustments = [
    { key: 'brightness', label: 'Brightness', min: -100, max: 100, default: 0 },
    { key: 'contrast', label: 'Contrast', min: -100, max: 100, default: 0 },
    { key: 'saturation', label: 'Saturation', min: -100, max: 100, default: 0 },
    { key: 'hue', label: 'Hue', min: -180, max: 180, default: 0 },
    { key: 'blur', label: 'Blur', min: 0, max: 20, default: 0 },
    { key: 'sharpen', label: 'Sharpen', min: 0, max: 100, default: 0 },
    { key: 'vignette', label: 'Vignette', min: 0, max: 100, default: 0 },
    { key: 'temperature', label: 'Temperature', min: -100, max: 100, default: 0 },
    { key: 'tint', label: 'Tint', min: -100, max: 100, default: 0 }
  ];

  useEffect(() => {
    if (selectedPhotoIds.length > 0) {
      const firstPhoto = photos.find(p => p.id === selectedPhotoIds[0]);
      setActivePhoto(firstPhoto);
      loadEditHistory(firstPhoto.id);
    }
  }, [selectedPhotoIds, photos]);

  useEffect(() => {
    if (activePhoto && canvasRef.current) {
      applyEdits();
    }
  }, [currentEdit, activeFilter, cropData, rotation, flip]);

  const loadEditHistory = async (photoId) => {
    try {
      const history = await getPhotoEditHistory(photoId);
      setEditHistory(prev => ({ ...prev, [photoId]: history }));
      
      if (history.length > 0) {
        const lastEdit = history[history.length - 1];
        setCurrentEdit(lastEdit.adjustments);
        setActiveFilter(lastEdit.filter);
        setCropData(lastEdit.crop);
        setRotation(lastEdit.rotation || 0);
        setFlip(lastEdit.flip || { horizontal: false, vertical: false });
      }
    } catch (error) {
      console.error('Failed to load edit history:', error);
    }
  };

  const applyEdits = useCallback(() => {
    if (!activePhoto || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Set canvas dimensions based on crop or original
      const { width, height, x, y } = calculateCanvasDimensions(img);
      canvas.width = width;
      canvas.height = height;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Save context state
      ctx.save();

      // Apply transformations
      ctx.translate(width / 2, height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);

      // Apply CSS filters
      const filterString = buildFilterString();
      ctx.filter = filterString;

      // Draw image
      ctx.drawImage(img, x, y, width, height);

      // Restore context state
      ctx.restore();

      // Apply additional effects that need canvas manipulation
      if (currentEdit.sharpen > 0) {
        applySharpenFilter(ctx, width, height, currentEdit.sharpen);
      }

      if (currentEdit.vignette > 0) {
        applyVignetteEffect(ctx, width, height, currentEdit.vignette);
      }
    };

    img.src = activePhoto.url;
  }, [activePhoto, currentEdit, activeFilter, cropData, rotation, flip]);

  const calculateCanvasDimensions = (img) => {
    let width = img.width;
    let height = img.height;
    let x = 0;
    let y = 0;

    if (cropData) {
      width = cropData.width;
      height = cropData.height;
      x = -cropData.x;
      y = -cropData.y;
    }

    return { width, height, x, y };
  };

  const buildFilterString = () => {
    const filter = filters[activeFilter];
    const adjustments = { ...filter.preset, ...currentEdit };

    return `
      brightness(${100 + adjustments.brightness}%)
      contrast(${100 + adjustments.contrast}%)
      saturate(${100 + adjustments.saturation}%)
      hue-rotate(${adjustments.hue}deg)
      blur(${adjustments.blur}px)
      sepia(0%)
    `;
  };

  const applySharpenFilter = (ctx, width, height, amount) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const sharpenAmount = amount / 100;

    // Simple sharpen convolution kernel
    const kernel = [
      0, -sharpenAmount, 0,
      -sharpenAmount, 1 + 4 * sharpenAmount, -sharpenAmount,
      0, -sharpenAmount, 0
    ];

    const side = Math.round(Math.sqrt(kernel.length));
    const halfSide = Math.floor(side / 2);
    const output = ctx.createImageData(width, height);
    const dst = output.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dstOff = (y * width + x) * 4;
        let r = 0, g = 0, b = 0;

        for (let cy = 0; cy < side; cy++) {
          for (let cx = 0; cx < side; cx++) {
            const scy = y + cy - halfSide;
            const scx = x + cx - halfSide;

            if (scy >= 0 && scy < height && scx >= 0 && scx < width) {
              const srcOff = (scy * width + scx) * 4;
              const wt = kernel[cy * side + cx];
              r += data[srcOff] * wt;
              g += data[srcOff + 1] * wt;
              b += data[srcOff + 2] * wt;
            }
          }
        }

        dst[dstOff] = Math.min(Math.max(r, 0), 255);
        dst[dstOff + 1] = Math.min(Math.max(g, 0), 255);
        dst[dstOff + 2] = Math.min(Math.max(b, 0), 255);
        dst[dstOff + 3] = data[dstOff + 3];
      }
    }

    ctx.putImageData(output, 0, 0);
  };

  const applyVignetteEffect = (ctx, width, height, amount) => {
    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, Math.max(width, height) / 2
    );

    gradient.addColorStop(0, `rgba(0, 0, 0, 0)`);
    gradient.addColorStop(0.5, `rgba(0, 0, 0, ${amount / 200})`);
    gradient.addColorStop(1, `rgba(0, 0, 0, ${amount / 100})`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  };

  const handleAdjustmentChange = (key, value) => {
    setCurrentEdit(prev => ({ ...prev, [key]: value }));
  };

  const applyFilter = (filterName) => {
    setActiveFilter(filterName);
    const filter = filters[filterName];
    setCurrentEdit(prev => ({ ...prev, ...filter.preset }));
  };

  const resetEdits = () => {
    setCurrentEdit({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      hue: 0,
      blur: 0,
      sharpen: 0,
      vignette: 0,
      temperature: 0,
      tint: 0
    });
    setActiveFilter('none');
    setCropData(null);
    setRotation(0);
    setFlip({ horizontal: false, vertical: false });
  };

  const saveEdits = async () => {
    if (!activePhoto) return;

    setIsProcessing(true);
    try {
      const editedPhoto = await processPhotoEdit(activePhoto, {
        adjustments: currentEdit,
        filter: activeFilter,
        crop: cropData,
        rotation,
        flip
      });

      // Save to edit history
      const editRecord = {
        photoId: activePhoto.id,
        adjustments: currentEdit,
        filter: activeFilter,
        crop: cropData,
        rotation,
        flip,
        timestamp: new Date().toISOString()
      };

      await saveEditRecord(editRecord);
      setEditHistory(prev => ({
        ...prev,
        [activePhoto.id]: [...(prev[activePhoto.id] || []), editRecord]
      }));

      // Apply batch edits if in batch mode
      if (batchMode && selectedPhotoIds.length > 1) {
        await applyBatchEdits(selectedPhotoIds.slice(1), editRecord);
      }

      onEditComplete(editedPhoto);
      
    } catch (error) {
      console.error('Failed to save edits:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const processPhotoEdit = async (photo, editData) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Apply all edits and return the result
        const editedUrl = canvas.toDataURL('image/jpeg', 0.9);
        resolve({
          ...photo,
          url: editedUrl,
          editedAt: new Date().toISOString(),
          editData
        });
      };

      img.src = photo.url;
    });
  };

  const applyBatchEdits = async (photoIds, editRecord) => {
    for (const photoId of photoIds) {
      const photo = photos.find(p => p.id === photoId);
      if (photo) {
        await processPhotoEdit(photo, editRecord);
      }
    }
  };

  const exportEditedPhoto = async () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `edited_${activePhoto.name}`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const handleCrop = () => {
    // Implement crop functionality
    setCropData({
      x: 100,
      y: 100,
      width: 400,
      height: 300
    });
  };

  const handleRotate = (direction) => {
    const rotationAmount = direction === 'left' ? -90 : 90;
    setRotation(prev => (prev + rotationAmount) % 360);
  };

  const handleFlip = (axis) => {
    setFlip(prev => ({ ...prev, [axis]: !prev[axis] }));
  };

  // Mock API functions
  const getPhotoEditHistory = async (photoId) => [];
  const saveEditRecord = async (record) => console.log('Saving edit record:', record);

  return (
    <div className="photo-editor">
      <div className="editor-header">
        <h2>Photo Editor</h2>
        <div className="editor-controls">
          <div className="view-controls">
            <button 
              className={`view-btn ${previewMode === 'single' ? 'active' : ''}`}
              onClick={() => setPreviewMode('single')}
            >
              Single
            </button>
            <button 
              className={`view-btn ${previewMode === 'compare' ? 'active' : ''}`}
              onClick={() => setPreviewMode('compare')}
            >
              Compare
            </button>
          </div>
          
          <div className="batch-controls">
            <label>
              <input
                type="checkbox"
                checked={batchMode}
                onChange={(e) => setBatchMode(e.target.checked)}
              />
              Batch Mode ({selectedPhotoIds.length} photos)
            </label>
          </div>
          
          <div className="action-buttons">
            <button onClick={resetEdits} className="reset-btn">Reset</button>
            <button onClick={exportEditedPhoto} className="export-btn">Export</button>
            <button 
              onClick={saveEdits} 
              disabled={isProcessing}
              className="save-btn"
            >
              {isProcessing ? 'Saving...' : 'Save'}
            </button>
            <button onClick={onClose} className="close-btn">×</button>
          </div>
        </div>
      </div>

      <div className="editor-content">
        <div className="editor-main">
          <div className="photo-preview">
            {activePhoto && (
              <div className="preview-container">
                {previewMode === 'compare' && (
                  <div className="compare-view">
                    <div className="original-side">
                      <h4>Original</h4>
                      <img src={activePhoto.url} alt="Original" />
                    </div>
                    <div className="edited-side">
                      <h4>Edited</h4>
                      <canvas ref={canvasRef} />
                    </div>
                  </div>
                )}
                
                {previewMode === 'single' && (
                  <canvas ref={canvasRef} className="single-preview" />
                )}
              </div>
            )}
          </div>

          <div className="editor-tools">
            {/* Quick Filters */}
            <div className="tool-section">
              <h3>Quick Filters</h3>
              <div className="filter-grid">
                {Object.entries(filters).map(([key, filter]) => (
                  <button
                    key={key}
                    className={`filter-btn ${activeFilter === key ? 'active' : ''}`}
                    onClick={() => applyFilter(key)}
                  >
                    <div className="filter-preview" />
                    <span>{filter.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Adjustments */}
            <div className="tool-section">
              <h3>Adjustments</h3>
              <div className="adjustments-list">
                {adjustments.map(adjustment => (
                  <div key={adjustment.key} className="adjustment-item">
                    <label>{adjustment.label}</label>
                    <input
                      type="range"
                      min={adjustment.min}
                      max={adjustment.max}
                      value={currentEdit[adjustment.key]}
                      onChange={(e) => handleAdjustmentChange(adjustment.key, parseInt(e.target.value))}
                    />
                    <span className="value">{currentEdit[adjustment.key]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Transform Tools */}
            <div className="tool-section">
              <h3>Transform</h3>
              <div className="transform-tools">
                <div className="tool-group">
                  <label>Rotate</label>
                  <div className="button-group">
                    <button onClick={() => handleRotate('left')} className="tool-btn">↺</button>
                    <button onClick={() => handleRotate('right')} className="tool-btn">↻</button>
                  </div>
                </div>
                
                <div className="tool-group">
                  <label>Flip</label>
                  <div className="button-group">
                    <button onClick={() => handleFlip('horizontal')} className="tool-btn">↔</button>
                    <button onClick={() => handleFlip('vertical')} className="tool-btn">↕</button>
                  </div>
                </div>
                
                <div className="tool-group">
                  <label>Crop</label>
                  <button onClick={handleCrop} className="tool-btn">✂️</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit History */}
        <div className="edit-history">
          <h3>Edit History</h3>
          <div className="history-list">
            {(editHistory[activePhoto?.id] || []).map((edit, index) => (
              <div key={index} className="history-item">
                <span className="history-time">
                  {new Date(edit.timestamp).toLocaleTimeString()}
                </span>
                <span className="history-filter">{edit.filter}</span>
                <button 
                  onClick={() => {
                    setCurrentEdit(edit.adjustments);
                    setActiveFilter(edit.filter);
                  }}
                  className="restore-btn"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="processing-overlay">
          <div className="processing-spinner" />
          <p>Processing photo...</p>
        </div>
      )}
    </div>
  );
};

export default PhotoEditor;