import { lazy } from 'react';

// Lazy load heavy components that aren't needed immediately
export const LazyCollageMaker = lazy(() => import('../Collage/CollageMaker'));
export const LazyPhotoStories = lazy(() => import('../Stories/PhotoStories'));
export const LazyPhotoSlideshow = lazy(() => import('../Slideshow/PhotoSlideshow'));
export const LazyMemoryLane = lazy(() => import('../MemoryLane/MemoryLane'));
export const LazyAlbumSharing = lazy(() => import('../Sharing/AlbumSharing'));
export const LazyHorseProfile = lazy(() => import('../HorseProfile'));
export const LazyAIStorageInsights = lazy(() => import('../Storage/AIStorageInsights'));
export const LazyStorageLedger = lazy(() => import('../Storage/StorageLedger'));
export const LazySettings = lazy(() => import('../Settings/Settings'));
export const LazySharedAlbumView = lazy(() => import('../Sharing/SharedAlbumView'));

// Create a loading fallback component
export const ComponentLoader = ({ type = 'default' }) => {
  const loaders = {
    default: (
      <div className="component-loader">
        <div className="component-loader__spinner"></div>
        <p>Loading...</p>
      </div>
    ),
    photo: (
      <div className="component-loader component-loader--photo">
        <div className="component-loader__spinner"></div>
        <p>Loading photos...</p>
      </div>
    ),
    storage: (
      <div className="component-loader component-loader--storage">
        <div className="component-loader__spinner"></div>
        <p>Loading storage insights...</p>
      </div>
    ),
    sharing: (
      <div className="component-loader component-loader--sharing">
        <div className="component-loader__spinner"></div>
        <p>Loading sharing options...</p>
      </div>
    )
  };

  return loaders[type] || loaders.default;
};

// Error boundary for lazy loaded components
export const LazyLoadError = ({ error, retry }) => (
  <div className="lazy-load-error">
    <div className="lazy-load-error__content">
      <h3>Failed to Load Component</h3>
      <p>{error?.message || 'Unable to load this component. Please try again.'}</p>
      <button onClick={retry} className="btn btn--primary btn--small">
        Retry
      </button>
    </div>
  </div>
);

// Higher-order component for lazy loading with error handling
export const withLazyLoad = (LazyComponent, loaderType = 'default') => {
  return function LazyWrapper(props) {
    return (
      <div className="lazy-wrapper">
        <LazyComponent {...props} />
      </div>
    );
  };
};