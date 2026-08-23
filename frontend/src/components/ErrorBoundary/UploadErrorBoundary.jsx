import ErrorBoundary from './ErrorBoundary';

const UploadErrorFallback = ({ error, retry, report, canRetry }) => (
  <div className="upload-error-boundary">
    <div className="upload-error__content">
      <div className="upload-error__icon">📤</div>
      <h3>Upload Failed</h3>
      <p>
        {error?.message || 'There was an error uploading your photos.'}
      </p>
      <div className="upload-error__actions">
        {canRetry && (
          <button onClick={retry} className="btn btn--primary">
            Try Again
          </button>
        )}
        <button onClick={report} className="btn btn--secondary">
          Report Issue
        </button>
      </div>
    </div>
  </div>
);

const UploadErrorBoundary = ({ children, ...props }) => (
  <ErrorBoundary 
    name="UploadErrorBoundary"
    fallback={UploadErrorFallback}
    maxRetries={2}
    {...props}
  >
    {children}
  </ErrorBoundary>
);

export default UploadErrorBoundary;