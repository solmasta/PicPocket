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