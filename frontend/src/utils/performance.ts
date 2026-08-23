// Performance monitoring utilities for PicPocket (TypeScript version)

import { PerformanceMetric, PerformanceSummary } from '../types';

// Performance metrics collection
class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private observers: Set<PerformanceObserver> = new Set();
  private isSupported: boolean;
  private startTime: number = performance.now();

  constructor() {
    this.isSupported = this.checkSupport();
    this.init();
  }

  private checkSupport(): boolean {
    return (
      'performance' in window &&
      'PerformanceObserver' in window &&
      'PerformanceNavigationTiming' in window
    );
  }

  private init(): void {
    if (!this.isSupported) {
      console.warn('Performance monitoring not supported in this browser');
      return;
    }

    this.observeNavigation();
    this.observeResources();
    this.observePaint();
    this.observeLongTasks();
    this.trackCustomMetrics();
  }

  private observeNavigation(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.recordMetric('navigation', {
              domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
              loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
              firstByte: navEntry.responseStart - navEntry.requestStart,
              totalTime: navEntry.loadEventEnd - navEntry.navigationStart,
              redirectTime: navEntry.redirectEnd - navEntry.redirectStart,
              dnsTime: navEntry.domainLookupEnd - navEntry.domainLookupStart,
              connectionTime: navEntry.connectEnd - navEntry.connectStart,
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

  private observeResources(): void {
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

  private observePaint(): void {
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

  private observeLongTasks(): void {
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

  private trackCustomMetrics(): void {
    this.trackComponentRenders();
    this.trackUserInteractions();
    this.trackImageLoading();
  }

  private trackComponentRenders(): void {
    if (process.env.NODE_ENV === 'development') {
      (window as any).trackComponentRender = (componentName: string, renderTime: number) => {
        this.recordMetric('component', {
          name: componentName,
          renderTime,
          timestamp: performance.now(),
        });
      };
    }
  }

  private trackUserInteractions(): void {
    const events: string[] = ['click', 'scroll', 'keydown', 'touchstart'];
    
    events.forEach(eventType => {
      document.addEventListener(eventType, (event: Event) => {
        const startTime = performance.now();
        
        requestAnimationFrame(() => {
          const endTime = performance.now();
          this.recordMetric('interaction', {
            type: eventType,
            target: (event.target as Element).tagName,
            duration: endTime - startTime,
            timestamp: startTime,
          });
        });
      }, { passive: true });
    });
  }

  private trackImageLoading(): void {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && (entry.target as Element).tagName === 'IMG') {
          const img = entry.target as HTMLImageElement;
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
    
    document.querySelectorAll('img').forEach(img => imageObserver.observe(img));
  }

  public recordMetric(type: string, data: Record<string, any>): void {
    const timestamp = performance.now();
    const metric: PerformanceMetric = {
      type,
      data,
      timestamp,
      url: window.location.href,
      userAgent: navigator.userAgent,
    };
    
    if (!this.metrics.has(type)) {
      this.metrics.set(type, []);
    }
    
    this.metrics.get(type)!.push(metric);
    
    // Notify observers
    this.observers.forEach(observer => {
      if ((observer as any).onMetric) {
        (observer as any).onMetric(metric);
      }
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 Performance Metric [${type}]:`, metric);
    }
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)/i)) return 'image';
    if (url.includes('.woff')) return 'font';
    return 'other';
  }

  public getMetrics(type?: string): PerformanceMetric[] | Record<string, PerformanceMetric[]> {
    if (type) {
      return this.metrics.get(type) || [];
    }
    return Object.fromEntries(this.metrics);
  }

  public getSummary(): PerformanceSummary {
    const summary: PerformanceSummary = {
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
      summary.navigation = navMetrics[navMetrics.length - 1].data as any;
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

  public exportMetrics(): void {
    const summary = this.getSummary();
    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  public clear(): void {
    this.metrics.clear();
  }

  public destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.clear();
  }
}

// Create singleton instance
let performanceMonitor: PerformanceMonitor | null = null;

export const getPerformanceMonitor = (): PerformanceMonitor => {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor();
  }
  return performanceMonitor;
};

// React hook for performance tracking
export const usePerformanceTracking = (componentName: string): void => {
  const startTimeRef = React.useRef<number | null>(null);
  
  React.useEffect(() => {
    startTimeRef.current = performance.now();
    
    return () => {
      if (startTimeRef.current && process.env.NODE_ENV === 'development') {
        const renderTime = performance.now() - startTimeRef.current;
        (window as any).trackComponentRender?.(componentName, renderTime);
      }
    };
  });
};

// Utility functions for manual performance tracking
export const measureFunction = <T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T => {
  return ((...args: any[]) => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    
    getPerformanceMonitor().recordMetric('function', {
      name,
      duration: end - start,
      timestamp: start,
    });
    
    return result;
  }) as T;
};

export const measureAsyncFunction = async <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  name: string
): Promise<ReturnType<T>> => {
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

export const mark = (name: string): void => {
  if (performance.mark) {
    performance.mark(name);
  }
};

export const measure = (name: string, startMark: string): void => {
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