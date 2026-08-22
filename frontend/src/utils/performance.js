/**
 * Performance utilities for photo management
 */

// Cache for processed images
const imageCache = new Map();
const CACHE_MAX_SIZE = 50;

// LRU cache management
function manageCache() {
  if (imageCache.size > CACHE_MAX_SIZE) {
    const firstKey = imageCache.keys().next().value;
    const entry = imageCache.get(firstKey);
    if (entry.img && entry.img.src) {
      entry.img.src = '';
    }
    imageCache.delete(firstKey);
  }
}

/**
 * Preload images for smoother browsing
 */
export function preloadImages(urls, onProgress) {
  const promises = urls.map((url, index) => {
    return new Promise((resolve, reject) => {
      if (imageCache.has(url)) {
        resolve(imageCache.get(url).img);
        return;
      }

      const img = new Image();
      img.onload = () => {
        imageCache.set(url, { img, timestamp: Date.now() });
        manageCache();
        if (onProgress) {
          onProgress((index + 1) / urls.length);
        }
        resolve(img);
      };
      img.onerror = () => {
        reject(new Error(`Failed to preload: ${url}`));
      };
      img.src = url;
    });
  });

  return Promise.all(promises);
}

/**
 * Get cached image
 */
export function getCachedImage(url) {
  const entry = imageCache.get(url);
  if (entry) {
    entry.timestamp = Date.now();
    return entry.img;
  }
  return null;
}

/**
 * Clear image cache
 */
export function clearImageCache() {
  imageCache.forEach((entry) => {
    if (entry.img && entry.img.src) {
      entry.img.src = '';
    }
  });
  imageCache.clear();
}

/**
 * Debounce function for search/filter inputs
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for scroll/resize handlers
 */
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Create intersection observer for lazy loading
 */
export function createLazyLoadObserver(callback, options = {}) {
  const defaultOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { ...defaultOptions, ...options });

  return observer;
}

/**
 * Optimize image loading with Web Workers consideration
 */
export function optimizeImageDataUrl(dataUrl, maxWidth = 1920, maxHeight = 1080, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      resolve({
        dataUrl: canvas.toDataURL('image/jpeg', quality),
        width,
        height,
        originalWidth: img.width,
        originalHeight: img.height
      });
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * Batch process items with progress callback
 */
export async function batchProcess(items, processor, { concurrency = 5, onProgress } = {}) {
  const results = [];
  const total = items.length;
  let processed = 0;

  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
    
    processed += batch.length;
    if (onProgress) {
      onProgress(processed / total);
    }
  }

  return results;
}

/**
 * Memory-efficient iterator for large arrays
 */
export function chunkedIterator(array, chunkSize, callback) {
  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    callback(chunk, i);
  }
}

/**
 * Estimate memory usage of an object
 */
export function estimateMemorySize(obj) {
  const str = JSON.stringify(obj);
  return new Blob([str]).size;
}