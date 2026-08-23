import React from 'react';

// Base skeleton component
const Skeleton = ({ 
  className = '', 
  variant = 'text', 
  width, 
  height, 
  lines = 1,
  circle = false,
  ...props 
}) => {
  const getClassName = () => {
    const baseClass = 'skeleton';
    const variantClass = `skeleton--${variant}`;
    const shapeClass = circle ? 'skeleton--circle' : '';
    
    return [baseClass, variantClass, shapeClass, className].filter(Boolean).join(' ');
  };

  const getStyle = () => {
    const style = {};
    
    if (width) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height) style.height = typeof height === 'number' ? `${height}px` : height;
    
    return style;
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`skeleton-text-group ${className}`} {...props}>
        {Array.from({ length: lines }, (_, index) => (
          <div
            key={index}
            className={getClassName()}
            style={{
              ...getStyle(),
              width: index === lines - 1 ? '60%' : '100%', // Last line shorter
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={getClassName()} style={getStyle()} {...props} />
  );
};

// Photo card skeleton
export const PhotoCardSkeleton = () => (
  <div className="photo-card-skeleton">
    <Skeleton variant="rectangular" height={200} className="photo-card-skeleton__image" />
    <div className="photo-card-skeleton__content">
      <Skeleton variant="text" width="80%" height={20} className="photo-card-skeleton__title" />
      <Skeleton variant="text" width="60%" height={16} className="photo-card-skeleton__subtitle" />
      <div className="photo-card-skeleton__actions">
        <Skeleton variant="rectangular" width={32} height={32} circle />
        <Skeleton variant="rectangular" width={32} height={32} circle />
        <Skeleton variant="rectangular" width={32} height={32} circle />
      </div>
    </div>
  </div>
);

// Gallery skeleton grid
export const GallerySkeleton = ({ count = 12 }) => (
  <div className="gallery-skeleton">
    {Array.from({ length: count }, (_, index) => (
      <PhotoCardSkeleton key={index} />
    ))}
  </div>
);

// Upload skeleton
export const UploadSkeleton = () => (
  <div className="upload-skeleton">
    <Skeleton variant="rectangular" height={120} className="upload-skeleton__dropzone" />
    <div className="upload-skeleton__preview">
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} variant="rectangular" height={80} className="upload-skeleton__item" />
      ))}
    </div>
    <Skeleton variant="rectangular" height={40} width={120} className="upload-skeleton__button" />
  </div>
);

// Settings skeleton
export const SettingsSkeleton = () => (
  <div className="settings-skeleton">
    <div className="settings-skeleton__section">
      <Skeleton variant="text" width={200} height={24} className="settings-skeleton__section-title" />
      <div className="settings-skeleton__fields">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="settings-skeleton__field">
            <Skeleton variant="text" width="40%" height={16} />
            <Skeleton variant="rectangular" height={32} className="settings-skeleton__input" />
          </div>
        ))}
      </div>
    </div>
    <div className="settings-skeleton__section">
      <Skeleton variant="text" width={200} height={24} className="settings-skeleton__section-title" />
      <div className="settings-skeleton__fields">
        {Array.from({ length: 2 }, (_, index) => (
          <div key={index} className="settings-skeleton__field">
            <Skeleton variant="text" width="40%" height={16} />
            <Skeleton variant="rectangular" height={32} className="settings-skeleton__input" />
          </div>
        ))}
      </div>
    </div>
    <Skeleton variant="rectangular" height={40} width={120} className="settings-skeleton__button" />
  </div>
);

// Storage skeleton
export const StorageSkeleton = () => (
  <div className="storage-skeleton">
    <div className="storage-skeleton__header">
      <Skeleton variant="text" width={150} height={24} />
      <Skeleton variant="text" width={100} height={16} />
    </div>
    <div className="storage-skeleton__stats">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="storage-skeleton__stat">
          <Skeleton variant="rectangular" height={60} className="storage-skeleton__stat-card" />
        </div>
      ))}
    </div>
    <div className="storage-skeleton__chart">
      <Skeleton variant="rectangular" height={200} className="storage-skeleton__chart-area" />
    </div>
  </div>
);

// Collage skeleton
export const CollageSkeleton = () => (
  <div className="collage-skeleton">
    <div className="collage-skeleton__canvas">
      <Skeleton variant="rectangular" height={400} className="collage-skeleton__workspace" />
    </div>
    <div className="collage-skeleton__sidebar">
      <Skeleton variant="text" width={120} height={20} />
      <div className="collage-skeleton__templates">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} variant="rectangular" height={60} className="collage-skeleton__template" />
        ))}
      </div>
    </div>
  </div>
);

// Stories skeleton
export const StoriesSkeleton = () => (
  <div className="stories-skeleton">
    <div className="stories-skeleton__header">
      <Skeleton variant="text" width={180} height={24} />
      <Skeleton variant="rectangular" height={32} width={100} />
    </div>
    <div className="stories-skeleton__grid">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="stories-skeleton__story">
          <Skeleton variant="rectangular" height={200} className="stories-skeleton__image" />
          <Skeleton variant="text" width="80%" height={16} />
        </div>
      ))}
    </div>
  </div>
);

// Loading overlay component
export const LoadingOverlay = ({ message = 'Loading...', show = true }) => {
  if (!show) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-overlay__content">
        <div className="loading-overlay__spinner"></div>
        <p className="loading-overlay__message">{message}</p>
      </div>
    </div>
  );
};

// Content loader with skeleton
export const ContentLoader = ({ 
  isLoading, 
  children, 
  skeleton = <Skeleton variant="text" lines={3} />,
  fallback = null,
  ...props 
}) => {
  if (isLoading) {
    return <div className="content-loader" {...props}>{skeleton}</div>;
  }

  if (fallback && !children) {
    return <div className="content-loader content-loader--fallback" {...props}>{fallback}</div>;
  }

  return <>{children}</>;
};

// Animated pulse skeleton wrapper
export const PulseSkeleton = ({ children, ...props }) => (
  <div className="pulse-skeleton" {...props}>
    {children}
  </div>
);

export default Skeleton;