/**
 * Batch Operations Panel Component
 * UI for managing bulk operations on photos
 * Progress tracking and queue management
 */

import React, { useState, useEffect } from 'react';
import { batchOperations } from '../../utils/batchOperations';
import './batchOperationsPanel.css';

const BatchOperationsPanel = ({ selectedPhotos, onOperationComplete }) => {
  const [activeBatches, setActiveBatches] = useState([]);
  const [batchHistory, setBatchHistory] = useState([]);
  const [selectedOperation, setSelectedOperation] = useState('');
  const [operationOptions, setOperationOptions] = useState({});
  const [isShowingOptions, setIsShowingOptions] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState(0);

  useEffect(() => {
    loadBatchHistory();
    const interval = setInterval(updateActiveBatches, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadBatchHistory = async () => {
    try {
      await batchOperations.loadBatchOperations();
      const history = batchOperations.getBatchHistory();
      setBatchHistory(history);
    } catch (error) {
      console.error('Failed to load batch history:', error);
    }
  };

  const updateActiveBatches = () => {
    const active = batchHistory.filter(batch => 
      batch.status === 'processing' || batch.status === 'queued'
    );
    setActiveBatches(active);
  };

  const handleOperationSelect = (operation) => {
    setSelectedOperation(operation);
    setIsShowingOptions(true);
  };

  const handleOperationStart = async () => {
    if (!selectedOperation || selectedPhotos.length === 0) return;

    try {
      const batchId = batchOperations.addToQueue(selectedOperation, selectedPhotos, operationOptions);
      
      // Start processing immediately
      const batch = await batchOperations.processBatch(batchId, (progress, completed, total) => {
        // Update progress in UI
        updateBatchProgress(batchId, progress, completed, total);
      });

      // Update history
      await loadBatchHistory();
      setIsShowingOptions(false);
      setSelectedOperation('');
      setOperationOptions({});
      
      if (onOperationComplete) {
        onOperationComplete(batch);
      }
      
    } catch (error) {
      console.error('Batch operation failed:', error);
    }
  };

  const updateBatchProgress = (batchId, progress, completed, total) => {
    setActiveBatches(prev => prev.map(batch => 
      batch.id === batchId 
        ? { ...batch, progress, completed, total }
        : batch
    ));
  };

  const handleCancelBatch = async (batchId) => {
    try {
      const success = batchOperations.cancelBatch(batchId);
      if (success) {
        await loadBatchHistory();
      }
    } catch (error) {
      console.error('Failed to cancel batch:', error);
    }
  };

  const handleClearHistory = () => {
    batchOperations.clearCompletedBatches();
    loadBatchHistory();
  };

  const getOperationIcon = (operation) => {
    const icons = {
      delete: '🗑️',
      tag: '🏷️',
      move: '📁',
      rename: '✏️',
      resize: '📐',
      compress: '🗜️',
      export: '💾',
      rotate: '🔄',
      filter: '🎨',
      metadata: '📝'
    };
    return icons[operation] || '⚡';
  };

  const getOperationName = (operation) => {
    const names = {
      delete: 'Delete Photos',
      tag: 'Add Tags',
      move: 'Move Photos',
      rename: 'Rename Photos',
      resize: 'Resize Photos',
      compress: 'Compress Photos',
      export: 'Export Photos',
      rotate: 'Rotate Photos',
      filter: 'Apply Filter',
      metadata: 'Update Metadata'
    };
    return names[operation] || operation;
  };

  const renderOperationOptions = () => {
    switch (selectedOperation) {
      case 'tag':
        return (
          <div className="option-group">
            <label>Tags to add:</label>
            <input
              type="text"
              placeholder="Enter tags separated by commas"
              onChange={(e) => setOperationOptions({ 
                tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
              })}
            />
          </div>
        );
      
      case 'move':
        return (
          <div className="option-group">
            <label>Destination:</label>
            <select onChange={(e) => setOperationOptions({ destination: e.target.value })}>
              <option value="">Select destination</option>
              <option value="/favorites">Favorites</option>
              <option value="/archive">Archive</option>
              <option value="/trash">Trash</option>
            </select>
          </div>
        );
      
      case 'rename':
        return (
          <div className="option-group">
            <label>Naming pattern:</label>
            <input
              type="text"
              placeholder="e.g., Vacation_{date}_{index}"
              defaultValue="Photo_{date}_{index}"
              onChange={(e) => setOperationOptions({ pattern: e.target.value })}
            />
            <small>
              Available: { '{name}', '{date}', '{time}', '{index}', '{year}', '{month}', '{day}', '{ext}' }
            </small>
          </div>
        );
      
      case 'resize':
        return (
          <div className="option-group">
            <label>Dimensions:</label>
            <div className="dimension-inputs">
              <input
                type="number"
                placeholder="Width"
                onChange={(e) => setOperationOptions(prev => ({ 
                  ...prev, 
                  dimensions: { ...prev.dimensions, width: parseInt(e.target.value) }
                }))}
              />
              <span>×</span>
              <input
                type="number"
                placeholder="Height"
                onChange={(e) => setOperationOptions(prev => ({ 
                  ...prev, 
                  dimensions: { ...prev.dimensions, height: parseInt(e.target.value) }
                }))}
              />
            </div>
          </div>
        );
      
      case 'compress':
        return (
          <div className="option-group">
            <label>Quality:</label>
            <input
              type="range"
              min="10"
              max="100"
              defaultValue="80"
              onChange={(e) => setOperationOptions({ quality: parseInt(e.target.value) })}
            />
            <span>{operationOptions.quality || 80}%</span>
          </div>
        );
      
      case 'export':
        return (
          <div className="option-group">
            <label>Format:</label>
            <select onChange={(e) => setOperationOptions({ format: e.target.value })}>
              <option value="jpeg">JPEG</option>
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
              <option value="tiff">TIFF</option>
            </select>
          </div>
        );
      
      case 'rotate':
        return (
          <div className="option-group">
            <label>Angle:</label>
            <select onChange={(e) => setOperationOptions({ angle: parseInt(e.target.value) })}>
              <option value="90">90°</option>
              <option value="-90">-90°</option>
              <option value="180">180°</option>
              <option value="-180">-180°</option>
            </select>
          </div>
        );
      
      case 'filter':
        return (
          <div className="option-group">
            <label>Filter:</label>
            <select onChange={(e) => setOperationOptions({ filter: e.target.value })}>
              <option value="vintage">Vintage</option>
              <option value="blackwhite">Black & White</option>
              <option value="sepia">Sepia</option>
              <option value="cold">Cold</option>
              <option value="warm">Warm</option>
              <option value="dramatic">Dramatic</option>
            </select>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (selectedPhotos.length === 0) {
    return (
      <div className="batch-operations-panel">
        <div className="empty-state">
          <h3>Batch Operations</h3>
          <p>Select photos to perform batch operations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="batch-operations-panel">
      <div className="panel-header">
        <h3>Batch Operations ({selectedPhotos.length} selected)</h3>
        <button onClick={handleClearHistory} className="clear-history-btn">
          Clear History
        </button>
      </div>

      {/* Operation Selection */}
      <div className="operation-selection">
        <div className="operation-grid">
          {[
            'delete', 'tag', 'move', 'rename', 'resize', 
            'compress', 'export', 'rotate', 'filter', 'metadata'
          ].map(operation => (
            <button
              key={operation}
              onClick={() => handleOperationSelect(operation)}
              className={`operation-btn ${selectedOperation === operation ? 'selected' : ''}`}
              disabled={operation === 'delete' && selectedPhotos.length > 100}
            >
              <span className="operation-icon">{getOperationIcon(operation)}</span>
              <span className="operation-name">{getOperationName(operation)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Operation Options Modal */}
      {isShowingOptions && (
        <div className="options-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h4>{getOperationName(selectedOperation)}</h4>
              <button 
                onClick={() => setIsShowingOptions(false)}
                className="close-btn"
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              {renderOperationOptions()}
              
              <div className="operation-info">
                <p>Photos to process: {selectedPhotos.length}</p>
                <p>Estimated time: {Math.round(estimatedTime / 1000)} seconds</p>
              </div>
            </div>
            
            <div className="modal-actions">
              <button onClick={() => setIsShowingOptions(false)} className="cancel-btn">
                Cancel
              </button>
              <button 
                onClick={handleOperationStart}
                className="start-btn"
                disabled={!selectedOperation}
              >
                Start Operation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Batches */}
      {activeBatches.length > 0 && (
        <div className="active-batches">
          <h4>Active Operations</h4>
          {activeBatches.map(batch => (
            <div key={batch.id} className="batch-item active">
              <div className="batch-info">
                <span className="batch-operation">
                  {getOperationIcon(batch.type)} {getOperationName(batch.type)}
                </span>
                <span className="batch-status">{batch.status}</span>
              </div>
              
              <div className="batch-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${batch.progress}%` }}
                  />
                </div>
                <span className="progress-text">
                  {batch.completed || 0} / {batch.total || batch.photos.length}
                </span>
              </div>
              
              <div className="batch-actions">
                {batch.status === 'processing' && (
                  <button 
                    onClick={() => handleCancelBatch(batch.id)}
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Batch History */}
      {batchHistory.length > 0 && (
        <div className="batch-history">
          <h4>Operation History</h4>
          <div className="history-list">
            {batchHistory.slice(0, 10).map(batch => (
              <div key={batch.id} className={`batch-item ${batch.status}`}>
                <div className="batch-info">
                  <span className="batch-operation">
                    {getOperationIcon(batch.type)} {getOperationName(batch.type)}
                  </span>
                  <span className="batch-count">{batch.photos.length} photos</span>
                  <span className="batch-time">
                    {new Date(batch.createdAt).toLocaleString()}
                  </span>
                </div>
                
                <div className="batch-result">
                  <span className={`status-badge ${batch.status}`}>
                    {batch.status}
                  </span>
                  {batch.results && (
                    <span className="result-summary">
                      {batch.results.filter(r => r.success).length} succeeded, 
                      {batch.results.filter(r => !r.success).length} failed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchOperationsPanel;