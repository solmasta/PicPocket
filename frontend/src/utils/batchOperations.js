/**
 * Batch Operations Utility
 * Handles bulk operations on multiple photos
 * Optimized for performance and memory efficiency
 */

class BatchOperations {
  constructor() {
    this.operationQueue = [];
    this.isProcessing = false;
    this.progressCallback = null;
    this.operationHistory = [];
  }

  /**
   * Add photos to batch operation queue
   */
  addToQueue(operationType, photos, options = {}) {
    const batchId = this.generateBatchId();
    const batchOperation = {
      id: batchId,
      type: operationType,
      photos: photos,
      options: options,
      status: 'queued',
      createdAt: new Date().toISOString(),
      progress: 0,
      results: [],
      errors: []
    };

    this.operationQueue.push(batchOperation);
    this.saveBatchOperation(batchOperation);
    
    return batchId;
  }

  /**
   * Process batch operations
   */
  async processBatch(batchId, progressCallback) {
    const batch = this.operationQueue.find(b => b.id === batchId);
    if (!batch) {
      throw new Error(`Batch ${batchId} not found`);
    }

    if (this.isProcessing) {
      throw new Error('Another batch operation is already in progress');
    }

    this.isProcessing = true;
    this.progressCallback = progressCallback;
    batch.status = 'processing';
    batch.startedAt = new Date().toISOString();

    try {
      await this.executeBatchOperation(batch);
      batch.status = 'completed';
      batch.completedAt = new Date().toISOString();
    } catch (error) {
      batch.status = 'failed';
      batch.error = error.message;
      batch.completedAt = new Date().toISOString();
    } finally {
      this.isProcessing = false;
      this.progressCallback = null;
      this.updateBatchOperation(batch);
    }

    return batch;
  }

  /**
   * Execute specific batch operation
   */
  async executeBatchOperation(batch) {
    const { type, photos, options } = batch;

    switch (type) {
      case 'delete':
        await this.batchDelete(photos, batch);
        break;
      case 'tag':
        await this.batchTag(photos, options.tags, batch);
        break;
      case 'move':
        await this.batchMove(photos, options.destination, batch);
        break;
      case 'rename':
        await this.batchRename(photos, options.pattern, batch);
        break;
      case 'resize':
        await this.batchResize(photos, options.dimensions, batch);
        break;
      case 'compress':
        await this.batchCompress(photos, options.quality, batch);
        break;
      case 'export':
        await this.batchExport(photos, options.format, batch);
        break;
      case 'rotate':
        await this.batchRotate(photos, options.angle, batch);
        break;
      case 'filter':
        await this.batchApplyFilter(photos, options.filter, batch);
        break;
      case 'metadata':
        await this.batchUpdateMetadata(photos, options.metadata, batch);
        break;
      default:
        throw new Error(`Unsupported batch operation: ${type}`);
    }
  }

  /**
   * Batch delete photos
   */
  async batchDelete(photos, batch) {
    const results = [];
    
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      
      try {
        await this.deletePhoto(photo);
        results.push({ photoId: photo.id, success: true });
        
        // Update progress
        batch.progress = Math.round(((i + 1) / photos.length) * 100);
        if (this.progressCallback) {
          this.progressCallback(batch.progress, i + 1, photos.length);
        }
        
        // Allow UI to breathe between operations
        await this.yieldToUI();
        
      } catch (error) {
        results.push({ photoId: photo.id, success: false, error: error.message });
        batch.errors.push({ photoId: photo.id, error: error.message });
      }
    }
    
    batch.results = results;
  }

  /**
   * Batch tag photos
   */
  async batchTag(photos, tags, batch) {
    const results = [];
    
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      
      try {
        const updatedPhoto = await this.addTagsToPhoto(photo, tags);
        results.push({ photoId: photo.id, success: true, photo: updatedPhoto });
        
        batch.progress = Math.round(((i + 1) / photos.length) * 100);
        if (this.progressCallback) {
          this.progressCallback(batch.progress, i + 1, photos.length);
        }
        
        await this.yieldToUI();
        
      } catch (error) {
        results.push({ photoId: photo.id, success: false, error: error.message });
        batch.errors.push({ photoId: photo.id, error: error.message });
      }
    }
    
    batch.results = results;
  }

  /**
   * Batch move photos to album/folder
   */
  async batchMove(photos, destination, batch) {
    const results = [];
    
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      
      try {
        const updatedPhoto = await this.movePhoto(photo, destination);
        results.push({ photoId: photo.id, success: true, photo: updatedPhoto });
        
        batch.progress = Math.round(((i + 1) / photos.length) * 100);
        if (this.progressCallback) {
          this.progressCallback(batch.progress, i + 1, photos.length);
        }
        
        await this.yieldToUI();
        
      } catch (error) {
        results.push({ photoId: photo.id, success: false, error: error.message });
        batch.errors.push({ photoId: photo.id, error: error.message });
      }
    }
    
    batch.results = results;
  }

  /**
   * Batch rename photos using pattern
   */
  async batchRename(photos, pattern, batch) {
    const results = [];
    
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      
      try {
        const newName = this.generateNameFromPattern(photo, pattern, i + 1);
        const updatedPhoto = await this.renamePhoto(photo, newName);
        results.push({ photoId: photo.id, success: true, photo: updatedPhoto, newName });
        
        batch.progress = Math.round(((i + 1) / photos.length) * 100);
        if (this.progressCallback) {
          this.progressCallback(batch.progress, i + 1, photos.length);
        }
        
        await this.yieldToUI();
        
      } catch (error) {
        results.push({ photoId: photo.id, success: false, error: error.message });
        batch.errors.push({ photoId: photo.id, error: error.message });
      }
    }
    
    batch.results = results;
  }

  /**
   * Batch resize photos
   */
  async batchResize(photos, dimensions, batch) {
    const results = [];
    
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      
      try {
        const resizedPhoto = await this.resizePhoto(photo, dimensions);
        results.push({ photoId: photo.id, success: true, photo: resizedPhoto });
        
        batch.progress = Math.round(((i + 1) / photos.length) * 100);
        if (this.progressCallback) {
          this.progressCallback(batch.progress, i + 1, photos.length);
        }
        
        await this.yieldToUI();
        
      } catch (error) {
        results.push({ photoId: photo.id, success: false, error: error.message });
        batch.errors.push({ photoId: photo.id, error: error.message });
      }
    }
    
    batch.results = results;
  }

  /**
   * Batch compress photos
   */
  async batchCompress(photos, quality, batch) {
    const results = [];
    
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      
      try {
        const compressedPhoto = await this.compressPhoto(photo, quality);
        results.push({ photoId: photo.id, success: true, photo: compressedPhoto });
        
        batch.progress = Math.round(((i + 1) / photos.length) * 100);
        if (this.progressCallback) {
          this.progressCallback(batch.progress, i + 1, photos.length);
        }
        
        await this.yieldToUI();
        
      } catch (error) {
        results.push({ photoId: photo.id, success: false, error: error.message });
        batch.errors.push({ photoId: photo.id, error: error.message });
      }
    }
    
    batch.results = results;
  }

  /**
   * Batch export photos
   */
  async batchExport(photos, format, batch) {
    const results = [];
    
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      
      try {
        const exportedPhoto = await this.exportPhoto(photo, format);
        results.push({ photoId: photo.id, success: true, photo: exportedPhoto });
        
        batch.progress = Math.round(((i + 1) / photos.length) * 100);
        if (this.progressCallback) {
          this.progressCallback(batch.progress, i + 1, photos.length);
        }
        
        await this.yieldToUI();
        
      } catch (error) {
        results.push({ photoId: photo.id, success: false, error: error.message });
        batch.errors.push({ photoId: photo.id, error: error.message });
      }
    }
    
    batch.results = results;
  }

  /**
   * Batch rotate photos
   */
  async batchRotate(photos, angle, batch) {
    const results = [];
    
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      
      try {
        const rotatedPhoto = await this.rotatePhoto(photo, angle);
        results.push({ photoId: photo.id, success: true, photo: rotatedPhoto });
        
        batch.progress = Math.round(((i + 1) / photos.length) * 100);
        if (this.progressCallback) {
          this.progressCallback(batch.progress, i + 1, photos.length);
        }
        
        await this.yieldToUI();
        
      } catch (error) {
        results.push({ photoId: photo.id, success: false, error: error.message });
        batch.errors.push({ photoId: photo.id, error: error.message });
      }
    }
    
    batch.results = results;
  }

  /**
   * Batch apply filter to photos
   */
  async batchApplyFilter(photos, filter, batch) {
    const results = [];
    
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      
      try {
        const filteredPhoto = await this.applyFilterToPhoto(photo, filter);
        results.push({ photoId: photo.id, success: true, photo: filteredPhoto });
        
        batch.progress = Math.round(((i + 1) / photos.length) * 100);
        if (this.progressCallback) {
          this.progressCallback(batch.progress, i + 1, photos.length);
        }
        
        await this.yieldToUI();
        
      } catch (error) {
        results.push({ photoId: photo.id, success: false, error: error.message });
        batch.errors.push({ photoId: photo.id, error: error.message });
      }
    }
    
    batch.results = results;
  }

  /**
   * Batch update metadata
   */
  async batchUpdateMetadata(photos, metadata, batch) {
    const results = [];
    
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      
      try {
        const updatedPhoto = await this.updatePhotoMetadata(photo, metadata);
        results.push({ photoId: photo.id, success: true, photo: updatedPhoto });
        
        batch.progress = Math.round(((i + 1) / photos.length) * 100);
        if (this.progressCallback) {
          this.progressCallback(batch.progress, i + 1, photos.length);
        }
        
        await this.yieldToUI();
        
      } catch (error) {
        results.push({ photoId: photo.id, success: false, error: error.message });
        batch.errors.push({ photoId: photo.id, error: error.message });
      }
    }
    
    batch.results = results;
  }

  /**
   * Generate name from pattern
   */
  generateNameFromPattern(photo, pattern, index) {
    const date = new Date(photo.createdAt);
    const replacements = {
      '{name}': photo.name.replace(/\.[^/.]+$/, ''),
      '{date}': date.toISOString().split('T')[0],
      '{time}': date.toTimeString().split(' ')[0].replace(/:/g, '-'),
      '{index}': index.toString().padStart(3, '0'),
      '{year}': date.getFullYear().toString(),
      '{month}': (date.getMonth() + 1).toString().padStart(2, '0'),
      '{day}': date.getDate().toString().padStart(2, '0'),
      '{ext}': photo.name.split('.').pop()
    };

    let newName = pattern;
    Object.entries(replacements).forEach(([placeholder, value]) => {
      newName = newName.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
    });

    return newName;
  }

  /**
   * Yield to UI thread
   */
  async yieldToUI() {
    return new Promise(resolve => {
      setTimeout(resolve, 0);
    });
  }

  /**
   * Generate batch ID
   */
  generateBatchId() {
    return 'batch_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get batch operation
   */
  getBatchOperation(batchId) {
    return this.operationQueue.find(b => b.id === batchId);
  }

  /**
   * Cancel batch operation
   */
  cancelBatch(batchId) {
    const batch = this.operationQueue.find(b => b.id === batchId);
    if (batch && batch.status === 'processing') {
      batch.status = 'cancelled';
      batch.completedAt = new Date().toISOString();
      this.isProcessing = false;
      this.updateBatchOperation(batch);
      return true;
    }
    return false;
  }

  /**
   * Get batch history
   */
  getBatchHistory() {
    return this.operationQueue.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  /**
   * Clear completed batches
   */
  clearCompletedBatches() {
    this.operationQueue = this.operationQueue.filter(batch => 
      batch.status !== 'completed' && batch.status !== 'failed'
    );
  }

  /**
   * Estimate batch operation time
   */
  estimateOperationTime(operationType, photoCount) {
    const operations = {
      delete: 500,      // 500ms per photo
      tag: 300,         // 300ms per photo
      move: 400,        // 400ms per photo
      rename: 200,      // 200ms per photo
      resize: 2000,     // 2s per photo
      compress: 1500,   // 1.5s per photo
      export: 3000,     // 3s per photo
      rotate: 1000,     // 1s per photo
      filter: 5000,     // 5s per photo
      metadata: 200     // 200ms per photo
    };

    const baseTime = (operations[operationType] || 500) * photoCount;
    const overhead = 1000; // 1s overhead
    
    return baseTime + overhead;
  }

  // Individual photo operations (mock implementations)
  async deletePhoto(photo) {
    console.log(`Deleting photo: ${photo.id}`);
    // Implementation would delete from storage
  }

  async addTagsToPhoto(photo, tags) {
    console.log(`Adding tags ${tags.join(', ')} to photo: ${photo.id}`);
    return {
      ...photo,
      tags: [...(photo.tags || []), ...tags]
    };
  }

  async movePhoto(photo, destination) {
    console.log(`Moving photo ${photo.id} to ${destination}`);
    return {
      ...photo,
      location: destination
    };
  }

  async renamePhoto(photo, newName) {
    console.log(`Renaming photo ${photo.id} to ${newName}`);
    return {
      ...photo,
      name: newName
    };
  }

  async resizePhoto(photo, dimensions) {
    console.log(`Resizing photo ${photo.id} to ${dimensions.width}x${dimensions.height}`);
    // Implementation would resize the image
    return photo;
  }

  async compressPhoto(photo, quality) {
    console.log(`Compressing photo ${photo.id} to quality ${quality}`);
    // Implementation would compress the image
    return photo;
  }

  async exportPhoto(photo, format) {
    console.log(`Exporting photo ${photo.id} as ${format}`);
    // Implementation would convert the image format
    return photo;
  }

  async rotatePhoto(photo, angle) {
    console.log(`Rotating photo ${photo.id} by ${angle} degrees`);
    // Implementation would rotate the image
    return photo;
  }

  async applyFilterToPhoto(photo, filter) {
    console.log(`Applying filter ${filter} to photo ${photo.id}`);
    // Implementation would apply the filter
    return photo;
  }

  async updatePhotoMetadata(photo, metadata) {
    console.log(`Updating metadata for photo ${photo.id}`);
    return {
      ...photo,
      metadata: { ...photo.metadata, ...metadata }
    };
  }

  // Storage operations
  async saveBatchOperation(batch) {
    // Save to IndexedDB or local storage
    localStorage.setItem(`batch_${batch.id}`, JSON.stringify(batch));
  }

  async updateBatchOperation(batch) {
    // Update in IndexedDB or local storage
    localStorage.setItem(`batch_${batch.id}`, JSON.stringify(batch));
  }

  async loadBatchOperations() {
    // Load from IndexedDB or local storage
    const batches = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('batch_')) {
        const batch = JSON.parse(localStorage.getItem(key));
        batches.push(batch);
      }
    }
    this.operationQueue = batches;
  }
}

// Create singleton instance
export const batchOperations = new BatchOperations();
export default batchOperations;