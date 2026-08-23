import ErrorBoundary from './ErrorBoundary';

const AuthErrorFallback = ({ error, retry }) => (
  <div className="auth-error-boundary">
    <div className="auth-error__content">
      <div className="auth-error__icon">🔐</div>
      <h3>Authentication Error</h3>
      <p>
        {error?.message || 'There was an error with authentication.'}
      </p>
      <div className="auth-error__actions">
        <button onClick={retry} className="btn btn--primary">
          Try Again
        </button>
        <button onClick={() => window.location.href = '/'} className="btn btn--secondary">
          Go to Login
        </button>
      </div>
    </div>
  </div>
);

const AuthErrorBoundary = ({ children, ...props }) => (
  <ErrorBoundary 
    name="AuthErrorBoundary"
    fallback={AuthErrorFallback}
    maxRetries={1}
    {...props}
  >
    {children}
  </ErrorBoundary>
);

export default AuthErrorBoundary;