import ErrorBoundary from './ErrorBoundary';

const PhotoErrorFallback = ({ error, retry, canRetry, retryCount }) => (
  <div className="photo-error-boundary">
    <div className="photo-error__content">
      <div className="photo-error__icon">📷</div>
      <h3>Photo Loading Error</h3>
      <p>
        {error?.message || 'Failed to load or process this photo.'}
      </p>
      {canRetry && (
        <button onClick={retry} className="btn btn--small btn--primary">
          Retry {retryCount > 0 && `(${retryCount})`}
        </button>
      )}
    </div>
  </div>
);

const PhotoErrorBoundary = ({ children, ...props }) => (
  <ErrorBoundary 
    name="PhotoErrorBoundary"
    fallback={PhotoErrorFallback}
    maxRetries={2}
    {...props}
  >
    {children}
  </ErrorBoundary>
);

export default PhotoErrorBoundary;