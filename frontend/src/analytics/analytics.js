/**
 * User Analytics and Insights System
 * Tracks user behavior, feature usage, and engagement metrics
 * Privacy-focused with opt-out options
 */

import { performanceMonitor } from '../utils/performance';

class UserAnalytics {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.userId = this.getUserId();
    this.events = [];
    this.pageViews = [];
    this.featureUsage = {};
    this.errorEvents = [];
    this.conversionEvents = [];
    this.isOptedOut = localStorage.getItem('analytics_opt_out') === 'true';
    this.sessionStartTime = Date.now();
    this.lastActivityTime = Date.now();
    
    // Initialize tracking
    this.initializeTracking();
  }

  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  getUserId() {
    let userId = localStorage.getItem('user_analytics_id');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('user_analytics_id', userId);
    }
    return userId;
  }

  initializeTracking() {
    if (this.isOptedOut) return;

    // Track page views
    this.trackPageView();
    
    // Track user interactions
    this.trackUserInteractions();
    
    // Track feature usage
    this.trackFeatureUsage();
    
    // Track performance metrics
    this.trackPerformanceMetrics();
    
    // Track errors
    this.trackErrors();
    
    // Track session duration
    this.trackSessionDuration();
    
    // Track conversions
    this.trackConversions();
    
    // Send data periodically
    setInterval(() => this.sendAnalyticsData(), 30000); // Every 30 seconds
  }

  trackPageView(path = window.location.pathname) {
    if (this.isOptedOut) return;

    const pageView = {
      sessionId: this.sessionId,
      userId: this.userId,
      path: path,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      screenResolution: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      timestamp: Date.now()
    };

    this.pageViews.push(pageView);
    this.events.push({
      type: 'page_view',
      data: pageView,
      timestamp: Date.now()
    });

    // Track page performance
    setTimeout(() => {
      const loadTime = performance.now();
      this.trackEvent('page_load_complete', {
        path,
        loadTime,
        timestamp: Date.now()
      });
    }, 0);
  }

  trackUserInteractions() {
    if (this.isOptedOut) return;

    // Track clicks
    document.addEventListener('click', (event) => {
      const target = event.target;
      const elementData = this.getElementData(target);
      
      this.trackEvent('click', {
        element: elementData,
        x: event.clientX,
        y: event.clientY,
        timestamp: Date.now()
      });
    });

    // Track scrolls
    let scrollTimeout;
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.trackEvent('scroll', {
          scrollTop: window.pageYOffset,
          scrollHeight: document.documentElement.scrollHeight,
          viewportHeight: window.innerHeight,
          scrollPercentage: Math.round((window.pageYOffset / (document.documentElement.scrollHeight - window.innerHeight)) * 100),
          timestamp: Date.now()
        });
      }, 100);
    });

    // Track form interactions
    document.addEventListener('focus', (event) => {
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        this.trackEvent('form_focus', {
          fieldName: event.target.name || event.target.id,
          fieldType: event.target.type,
          timestamp: Date.now()
        });
      }
    }, true);

    // Track keyboard shortcuts
    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey || event.metaKey) {
        this.trackEvent('keyboard_shortcut', {
          key: event.key,
          ctrlKey: event.ctrlKey,
          metaKey: event.metaKey,
          shiftKey: event.shiftKey,
          timestamp: Date.now()
        });
      }
    });
  }

  trackFeatureUsage() {
    if (this.isOptedOut) return;

    // Track photo uploads
    this.trackFeature('photo_upload', () => {
      const uploadCount = parseInt(localStorage.getItem('upload_count') || '0');
      localStorage.setItem('upload_count', uploadCount + 1);
    });

    // Track photo views
    this.trackFeature('photo_view', (photoId) => {
      const viewCount = parseInt(localStorage.getItem(`photo_views_${photoId}`) || '0');
      localStorage.setItem(`photo_views_${photoId}`, viewCount + 1);
    });

    // Track search usage
    this.trackFeature('search', (query) => {
      const searchCount = parseInt(localStorage.getItem('search_count') || '0');
      localStorage.setItem('search_count', searchCount + 1);
      localStorage.setItem('last_search', query);
    });

    // Track filter usage
    this.trackFeature('filter', (filterType) => {
      const filterKey = `filter_${filterType}_count`;
      const filterCount = parseInt(localStorage.getItem(filterKey) || '0');
      localStorage.setItem(filterKey, filterCount + 1);
    });

    // Track theme changes
    this.trackFeature('theme_change', (theme) => {
      localStorage.setItem('last_theme_change', Date.now());
    });

    // Track tag usage
    this.trackFeature('tag_add', (tag) => {
      const tagCount = parseInt(localStorage.getItem(`tag_${tag}_count`) || '0');
      localStorage.setItem(`tag_${tag}_count`, tagCount + 1);
    });
  }

  trackFeature(featureName, callback) {
    if (this.isOptedOut) return;

    // Track feature usage
    if (!this.featureUsage[featureName]) {
      this.featureUsage[featureName] = {
        count: 0,
        firstUsed: Date.now(),
        lastUsed: Date.now()
      };
    }

    this.featureUsage[featureName].count++;
    this.featureUsage[featureName].lastUsed = Date.now();

    // Track event
    this.trackEvent('feature_used', {
      feature: featureName,
      usageCount: this.featureUsage[featureName].count,
      timestamp: Date.now()
    });

    // Execute callback if provided
    if (callback) callback();
  }

  trackPerformanceMetrics() {
    if (this.isOptedOut) return;

    // Track Core Web Vitals
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            this.trackEvent('performance_lcp', {
              value: entry.startTime,
              timestamp: Date.now()
            });
          } else if (entry.entryType === 'first-input') {
            this.trackEvent('performance_fid', {
              value: entry.processingStart - entry.startTime,
              timestamp: Date.now()
            });
          } else if (entry.entryType === 'layout-shift') {
            if (!entry.hadRecentInput) {
              this.trackEvent('performance_cls', {
                value: entry.value,
                timestamp: Date.now()
              });
            }
          }
        }
      });

      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
    }

    // Track custom performance metrics
    const metrics = performanceMonitor.getMetrics();
    this.trackEvent('performance_summary', {
      metrics,
      timestamp: Date.now()
    });
  }

  trackErrors() {
    if (this.isOptedOut) return;

    // Track JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackError('javascript_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: Date.now()
      });
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError('promise_rejection', {
        reason: event.reason?.toString(),
        stack: event.reason?.stack,
        timestamp: Date.now()
      });
    });

    // Track API errors
    this.trackApiErrors();
  }

  trackError(errorType, errorData) {
    if (this.isOptedOut) return;

    const error = {
      type: errorType,
      data: errorData,
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.errorEvents.push(error);
    this.events.push({
      type: 'error',
      data: error,
      timestamp: Date.now()
    });
  }

  trackApiErrors() {
    // Override fetch to track API errors
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        if (!response.ok) {
          this.trackError('api_error', {
            url: args[0],
            method: args[1]?.method || 'GET',
            status: response.status,
            statusText: response.statusText,
            timestamp: Date.now()
          });
        }
        
        return response;
      } catch (error) {
        this.trackError('api_network_error', {
          url: args[0],
          method: args[1]?.method || 'GET',
          error: error.message,
          timestamp: Date.now()
        });
        throw error;
      }
    };
  }

  trackSessionDuration() {
    if (this.isOptedOut) return;

    // Update last activity time
    const updateActivity = () => {
      this.lastActivityTime = Date.now();
    };

    document.addEventListener('click', updateActivity);
    document.addEventListener('scroll', updateActivity);
    document.addEventListener('keydown', updateActivity);

    // Track session end
    window.addEventListener('beforeunload', () => {
      const sessionDuration = Date.now() - this.sessionStartTime;
      this.trackEvent('session_end', {
        duration: sessionDuration,
        startTime: this.sessionStartTime,
        endTime: Date.now(),
        timestamp: Date.now()
      });
    });
  }

  trackConversions() {
    if (this.isOptedOut) return;

    // Track user registration
    this.trackConversion('user_registered', () => {
      return localStorage.getItem('user_registered') === 'true';
    });

    // Track first photo upload
    this.trackConversion('first_photo_upload', () => {
      return parseInt(localStorage.getItem('upload_count') || '0') > 0;
    });

    // Track photo organization
    this.trackConversion('photo_organized', () => {
      return localStorage.getItem('photos_tagged') === 'true';
    });

    // Track feature discovery
    this.trackConversion('feature_discovery', () => {
      return Object.keys(this.featureUsage).length > 3;
    });
  }

  trackConversion(conversionName, conditionCheck) {
    if (this.isOptedOut) return;

    const conversionKey = `conversion_${conversionName}`;
    if (localStorage.getItem(conversionKey) === 'true') return;

    if (conditionCheck()) {
      const conversion = {
        name: conversionName,
        sessionId: this.sessionId,
        userId: this.userId,
        timestamp: Date.now(),
        sessionDuration: Date.now() - this.sessionStartTime
      };

      this.conversionEvents.push(conversion);
      this.events.push({
        type: 'conversion',
        data: conversion,
        timestamp: Date.now()
      });

      localStorage.setItem(conversionKey, 'true');
    }
  }

  trackEvent(eventName, eventData) {
    if (this.isOptedOut) return;

    const event = {
      name: eventName,
      data: eventData,
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: Date.now()
    };

    this.events.push(event);

    // Limit events array size
    if (this.events.length > 1000) {
      this.events = this.events.slice(-500);
    }
  }

  getElementData(element) {
    return {
      tagName: element.tagName,
      id: element.id,
      className: element.className,
      textContent: element.textContent?.slice(0, 50),
      attributes: this.getElementAttributes(element)
    };
  }

  getElementAttributes(element) {
    const attributes = {};
    for (const attr of element.attributes) {
      if (['id', 'class', 'data-testid'].includes(attr.name)) {
        attributes[attr.name] = attr.value;
      }
    }
    return attributes;
  }

  async sendAnalyticsData() {
    if (this.isOptedOut || this.events.length === 0) return;

    try {
      const data = {
        sessionId: this.sessionId,
        userId: this.userId,
        events: this.events.slice(), // Copy events
        pageViews: this.pageViews.slice(),
        featureUsage: { ...this.featureUsage },
        errorEvents: this.errorEvents.slice(),
        conversionEvents: this.conversionEvents.slice(),
        sessionInfo: {
          startTime: this.sessionStartTime,
          lastActivityTime: this.lastActivityTime,
          duration: Date.now() - this.sessionStartTime
        },
        timestamp: Date.now()
      };

      // Send to analytics endpoint
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      // Clear sent events
      this.events = [];
      this.errorEvents = [];
      this.conversionEvents = [];

    } catch (error) {
      console.warn('Failed to send analytics data:', error);
    }
  }

  // Public API methods
  getAnalyticsData() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      events: this.events,
      pageViews: this.pageViews,
      featureUsage: this.featureUsage,
      errorEvents: this.errorEvents,
      conversionEvents: this.conversionEvents,
      sessionInfo: {
        startTime: this.sessionStartTime,
        lastActivityTime: this.lastActivityTime,
        duration: Date.now() - this.sessionStartTime
      }
    };
  }

  optOut() {
    this.isOptedOut = true;
    localStorage.setItem('analytics_opt_out', 'true');
    this.clearLocalData();
  }

  optIn() {
    this.isOptedOut = false;
    localStorage.removeItem('analytics_opt_out');
    this.initializeTracking();
  }

  clearLocalData() {
    this.events = [];
    this.pageViews = [];
    this.featureUsage = {};
    this.errorEvents = [];
    this.conversionEvents = [];
  }

  isUserOptedOut() {
    return this.isOptedOut;
  }
}

// Create and export singleton instance
export const userAnalytics = new UserAnalytics();
export default userAnalytics;