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
// Performance monitoring utilities for PicPocket

// Performance metrics collection
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Set();
    this.isSupported = this.checkSupport();
    this.init();
  }

  checkSupport() {
    return (
      'performance' in window &&
      'PerformanceObserver' in window &&
      'PerformanceNavigationTiming' in window
    );
  }

  init() {
    if (!this.isSupported) {
      console.warn('Performance monitoring not supported in this browser');
      return;
    }

    // Observe navigation timing
    this.observeNavigation();
    
    // Observe resource timing
    this.observeResources();
    
    // Observe paint timing
    this.observePaint();
    
    // Observe long tasks
    this.observeLongTasks();
    
    // Track custom metrics
    this.trackCustomMetrics();
  }

  observeNavigation() {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            this.recordMetric('navigation', {
              domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
              loadComplete: entry.loadEventEnd - entry.loadEventStart,
              firstByte: entry.responseStart - entry.requestStart,
              totalTime: entry.loadEventEnd - entry.navigationStart,
              redirectTime: entry.redirectEnd - entry.redirectStart,
              dnsTime: entry.domainLookupEnd - entry.domainLookupStart,
              connectionTime: entry.connectEnd - entry.connectStart,
            });
          }
        }
      });
      observer.observe({ entryTypes: ['navigation'] });
      this.observers.add(observer);
    } catch (error) {
      console.warn('Navigation timing observation failed:', error);
    }
  }

  observeResources() {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            this.recordMetric('resource', {
              name: entry.name,
              type: this.getResourceType(entry.name),
              size: entry.transferSize || 0,
              duration: entry.duration,
              startTime: entry.startTime,
            });
          }
        }
      });
      observer.observe({ entryTypes: ['resource'] });
      this.observers.add(observer);
    } catch (error) {
      console.warn('Resource timing observation failed:', error);
    }
  }

  observePaint() {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'paint') {
            this.recordMetric('paint', {
              name: entry.name,
              time: entry.startTime,
            });
          }
        }
      });
      observer.observe({ entryTypes: ['paint'] });
      this.observers.add(observer);
    } catch (error) {
      console.warn('Paint timing observation failed:', error);
    }
  }

  observeLongTasks() {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'longtask') {
            this.recordMetric('longtask', {
              duration: entry.duration,
              startTime: entry.startTime,
            });
          }
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
      this.observers.add(observer);
    } catch (error) {
      console.warn('Long task observation failed:', error);
    }
  }

  trackCustomMetrics() {
    // Track component render times
    this.trackComponentRenders();
    
    // Track user interactions
    this.trackUserInteractions();
    
    // Track image loading
    this.trackImageLoading();
  }

  trackComponentRenders() {
    // This would be used with React Profiler
    // Hook into component lifecycle via a custom hook
    if (process.env.NODE_ENV === 'development') {
      window.trackComponentRender = (componentName, renderTime) => {
        this.recordMetric('component', {
          name: componentName,
          renderTime,
          timestamp: performance.now(),
        });
      };
    }
  }

  trackUserInteractions() {
    const events = ['click', 'scroll', 'keydown', 'touchstart'];
    
    events.forEach(eventType => {
      document.addEventListener(eventType, (event) => {
        const startTime = performance.now();
        
        // Use requestAnimationFrame to measure actual impact
        requestAnimationFrame(() => {
          const endTime = performance.now();
          this.recordMetric('interaction', {
            type: eventType,
            target: event.target.tagName,
            duration: endTime - startTime,
            timestamp: startTime,
          });
        });
      }, { passive: true });
    });
  }

  trackImageLoading() {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.target.tagName === 'IMG') {
          const img = entry.target;
          const startTime = performance.now();
          
          const onLoad = () => {
            const endTime = performance.now();
            this.recordMetric('imageLoad', {
              src: img.src,
              duration: endTime - startTime,
              size: img.naturalWidth * img.naturalHeight,
              timestamp: startTime,
            });
            img.removeEventListener('load', onLoad);
            img.removeEventListener('error', onError);
          };
          
          const onError = () => {
            this.recordMetric('imageLoadError', {
              src: img.src,
              timestamp: startTime,
            });
            img.removeEventListener('load', onLoad);
            img.removeEventListener('error', onError);
          };
          
          img.addEventListener('load', onLoad);
          img.addEventListener('error', onError);
        }
      });
    });
    
    // Observe all images
    document.querySelectorAll('img').forEach(img => imageObserver.observe(img));
  }

  recordMetric(type, data) {
    const timestamp = performance.now();
    const metric = {
      type,
      data,
      timestamp,
      url: window.location.href,
      userAgent: navigator.userAgent,
    };
    
    if (!this.metrics.has(type)) {
      this.metrics.set(type, []);
    }
    
    this.metrics.get(type).push(metric);
    
    // Notify observers
    this.observers.forEach(observer => {
      if (observer.onMetric) {
        observer.onMetric(metric);
      }
    });
    
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 Performance Metric [${type}]:`, metric);
    }
  }

  getResourceType(url) {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)/i)) return 'image';
    if (url.includes('.woff')) return 'font';
    return 'other';
  }

  getMetrics(type = null) {
    if (type) {
      return this.metrics.get(type) || [];
    }
    return Object.fromEntries(this.metrics);
  }

  getSummary() {
    const summary = {
      navigation: null,
      resources: {},
      paint: {},
      longTasks: [],
      components: [],
      interactions: [],
      images: [],
      errors: [],
    };
    
    // Navigation summary
    const navMetrics = this.metrics.get('navigation');
    if (navMetrics && navMetrics.length > 0) {
      summary.navigation = navMetrics[navMetrics.length - 1].data;
    }
    
    // Resource summary by type
    const resourceMetrics = this.metrics.get('resource') || [];
    resourceMetrics.forEach(metric => {
      const type = metric.data.type;
      if (!summary.resources[type]) {
        summary.resources[type] = {
          count: 0,
          totalSize: 0,
          totalDuration: 0,
          averageDuration: 0,
        };
      }
      summary.resources[type].count++;
      summary.resources[type].totalSize += metric.data.size;
      summary.resources[type].totalDuration += metric.data.duration;
    });
    
    Object.values(summary.resources).forEach(resource => {
      resource.averageDuration = resource.totalDuration / resource.count;
    });
    
    // Paint timing
    const paintMetrics = this.metrics.get('paint') || [];
    paintMetrics.forEach(metric => {
      summary.paint[metric.data.name] = metric.data.time;
    });
    
    // Long tasks
    summary.longTasks = (this.metrics.get('longtask') || []).map(m => m.data);
    
    // Component renders
    summary.components = (this.metrics.get('component') || []).map(m => m.data);
    
    // Interactions
    summary.interactions = (this.metrics.get('interaction') || []).map(m => m.data);
    
    // Image loading
    summary.images = (this.metrics.get('imageLoad') || []).map(m => m.data);
    summary.errors = (this.metrics.get('imageLoadError') || []).map(m => m.data);
    
    return summary;
  }

  exportMetrics() {
    const summary = this.getSummary();
    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  clear() {
    this.metrics.clear();
  }

  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.clear();
  }
}

// Create singleton instance
let performanceMonitor = null;

export const getPerformanceMonitor = () => {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor();
  }
  return performanceMonitor;
};

// React hook for performance tracking
export const usePerformanceTracking = (componentName) => {
  const startTime = useRef(null);
  
  useEffect(() => {
    startTime.current = performance.now();
    
    return () => {
      if (startTime.current && process.env.NODE_ENV === 'development') {
        const renderTime = performance.now() - startTime.current;
        window.trackComponentRender?.(componentName, renderTime);
      }
    };
  });
};

// Utility functions for manual performance tracking
export const measureFunction = (fn, name) => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  getPerformanceMonitor().recordMetric('function', {
    name,
    duration: end - start,
    timestamp: start,
  });
  
  return result;
};

export const measureAsyncFunction = async (fn, name) => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  
  getPerformanceMonitor().recordMetric('asyncFunction', {
    name,
    duration: end - start,
    timestamp: start,
  });
  
  return result;
};

export const mark = (name) => {
  if (performance.mark) {
    performance.mark(name);
  }
};

export const measure = (name, startMark) => {
  if (performance.measure) {
    try {
      performance.measure(name, startMark);
      const entries = performance.getEntriesByName(name, 'measure');
      if (entries.length > 0) {
        getPerformanceMonitor().recordMetric('measure', {
          name,
          duration: entries[entries.length - 1].duration,
          timestamp: entries[entries.length - 1].startTime,
        });
      }
    } catch (error) {
      console.warn('Performance measure failed:', error);
    }
  }
};

export default getPerformanceMonitor;
