import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getPerformanceMonitor } from '../../utils/performance';

const LazyImage = ({ 
  src, 
  alt, 
  className = '', 
  placeholder = null,
  onLoad = null,
  onError = null,
  threshold = 0.1,
  rootMargin = '50px',
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);
  const performanceMonitor = getPerformanceMonitor();

  // Setup intersection observer
  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(imgRef.current);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [threshold, rootMargin]);

  // Handle image load
  const handleLoad = useCallback((event) => {
    setIsLoaded(true);
    setHasError(false);
    
    // Track performance
    performanceMonitor.recordMetric('lazyImageLoad', {
      src,
      loadTime: performance.now(),
      naturalWidth: event.target.naturalWidth,
      naturalHeight: event.target.naturalHeight,
    });
    
    if (onLoad) {
      onLoad(event);
    }
  }, [src, onLoad, performanceMonitor]);

  // Handle image error
  const handleError = useCallback((event) => {
    setIsLoaded(false);
    setHasError(true);
    
    // Track error
    performanceMonitor.recordMetric('lazyImageError', {
      src,
      errorTime: performance.now(),
    });
    
    if (onError) {
      onError(event);
    }
  }, [src, onError, performanceMonitor]);

  // Generate placeholder
  const renderPlaceholder = () => {
    if (placeholder) {
      return typeof placeholder === 'function' ? placeholder() : placeholder;
    }
    
    return (
      <div className="lazy-image__placeholder">
        <div className="lazy-image__spinner"></div>
      </div>
    );
  };

  // Generate error state
  const renderError = () => (
    <div className="lazy-image__error">
      <div className="lazy-image__error-icon">🖼️</div>
      <span>Failed to load image</span>
    </div>
  );

  return (
    <div 
      ref={imgRef} 
      className={`lazy-image ${className}`}
      {...props}
    >
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`lazy-image__img ${isLoaded ? 'lazy-image__img--loaded' : ''}`}
          onLoad={handleLoad}
          onError={handleError}
          style={{ opacity: isLoaded ? 1 : 0 }}
        />
      )}
      
      {!isLoaded && !hasError && (
        <div className="lazy-image__overlay">
          {renderPlaceholder()}
        </div>
      )}
      
      {hasError && renderError()}
    </div>
  );
};

// Progressive image component with blur-up effect
export const ProgressiveImage = ({ 
  src, 
  placeholderSrc, 
  alt, 
  className = '',
  ...props 
}) => {
  const [imgSrc, setImgSrc] = useState(placeholderSrc || src);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      setImgSrc(src);
      setIsLoaded(true);
    };
    
    img.onerror = () => {
      // Keep placeholder if main image fails
      setIsLoaded(true);
    };
  }, [src]);

  return (
    <div className={`progressive-image ${className}`}>
      <img
        ref={imgRef}
        src={imgSrc}
        alt={alt}
        className={`progressive-image__img ${isLoaded ? 'progressive-image__img--loaded' : ''}`}
        {...props}
      />
      {!isLoaded && (
        <div className="progressive-image__placeholder">
          <div className="progressive-image__spinner"></div>
        </div>
      )}
    </div>
  );
};

// Optimized image gallery component
export const OptimizedGallery = ({ images, onImageClick = null }) => {
  const [visibleImages, setVisibleImages] = useState(new Set());
  const performanceMonitor = getPerformanceMonitor();

  const handleImageVisible = useCallback((index) => {
    setVisibleImages(prev => new Set([...prev, index]));
    performanceMonitor.recordMetric('galleryImageVisible', { index });
  }, [performanceMonitor]);

  return (
    <div className="optimized-gallery">
      {images.map((image, index) => (
        <LazyImage
          key={image.id || index}
          src={image.src}
          alt={image.alt || `Image ${index + 1}`}
          className="optimized-gallery__image"
          onClick={() => onImageClick && onImageClick(image, index)}
          onLoad={() => handleImageVisible(index)}
          threshold={0.05}
          rootMargin="100px"
        />
      ))}
    </div>
  );
};

// Image preloader utility
export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to preload image: ${src}`));
  });
};

// Batch image preloader
export const preloadImages = async (urls, concurrency = 3) => {
  const results = [];
  
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const batchPromises = batch.map(url => 
      preloadImage(url).catch(error => ({ error, url }))
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  return results;
};

// Image optimization utilities
export const optimizeImageUrl = (url, options = {}) => {
  const { width, height, quality = 80, format = 'auto' } = options;
  
  // This would integrate with image CDNs like Cloudinary, Imgix, etc.
  // For now, just return the original URL
  if (!url) return url;
  
  // Example: Cloudinary URL transformation
  if (url.includes('cloudinary')) {
    const transformations = [];
    if (width) transformations.push(`w_${width}`);
    if (height) transformations.push(`h_${height}`);
    if (quality !== 80) transformations.push(`q_${quality}`);
    if (format !== 'auto') transformations.push(`f_${format}`);
    
    if (transformations.length > 0) {
      return url.replace('/upload/', `/upload/${transformations.join(',')}/`);
    }
  }
  
  return url;
};

export default LazyImage;