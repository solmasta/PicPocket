import { Component } from 'react';
import { logError } from '../../utils/errorHandler';
import './ErrorBoundary.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0,
      maxRetries: props.maxRetries || 3
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    const errorContext = {
      componentStack: errorInfo?.componentStack,
      errorBoundary: 'ErrorBoundary'
    };
    logError('React ErrorBoundary', error, errorContext);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onRetry) {
      this.props.onRetry();
      errorBoundary: this.props.name || 'ErrorBoundary',
      retryCount: this.state.retryCount,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    logError('React ErrorBoundary', error, errorContext);
    this.setState({ errorInfo });

    // Track errors in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.groupEnd();
    }
  }

  handleRetry = () => {
    if (this.state.retryCount < this.state.maxRetries) {
      this.setState(prevState => ({ 
        hasError: false, 
        error: null, 
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));
      
      if (this.props.onRetry) {
        this.props.onRetry();
      }
    } else {
      this.setState({ hasError: true });
    }
  };

  handleReport = () => {
    const { error, errorInfo } = this.state;
    const reportData = {
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
      url: window.location.href,
      retryCount: this.state.retryCount,
      appVersion: process.env.REACT_APP_VERSION || 'unknown'
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          retry: this.handleRetry,
          report: this.handleReport,
          canRetry: this.state.retryCount < this.state.maxRetries,
          retryCount: this.state.retryCount
        });
      }

      const canRetry = this.state.retryCount < this.state.maxRetries;
      const isLastRetry = this.state.retryCount === this.state.maxRetries - 1;

      return (
        <div className="error-boundary" role="alert">
          <div className="error-boundary__content">
            <div className="error-boundary__icon">⚠️</div>
            <h2>Something went wrong</h2>
            <p className="error-boundary__message">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <div className="error-boundary__actions">
              <button onClick={this.handleRetry} className="btn btn--primary">
                Try Again
              </button>
              <button onClick={this.handleReport} className="btn btn--secondary">
                Report Issue
              </button>
              <button onClick={() => window.location.reload()} className="btn btn--secondary">
            <div className="error-boundary__icon" aria-hidden="true">
              {canRetry ? '⚠️' : '🚨'}
            </div>
            <h1>Oops! Something went wrong</h1>
            
            <p className="error-boundary__message">
              {this.state.error?.message || 'An unexpected error occurred while rendering this component.'}
            </p>
            
            {isLastRetry && (
              <p className="error-boundary__hint">
                This was the last retry attempt. If the problem persists, please report the issue.
              </p>
            )}
            
            <div className="error-boundary__actions" role="group">
              {canRetry && (
                <button 
                  onClick={this.handleRetry} 
                  className="btn btn--primary"
                  aria-label={`Try again (attempt ${this.state.retryCount + 1} of ${this.state.maxRetries})`}
                >
                  Try Again {this.state.retryCount > 0 && `(${this.state.retryCount + 1}/${this.state.maxRetries})`}
                </button>
              )}
              
              <button 
                onClick={this.handleGoHome} 
                className="btn btn--secondary"
                aria-label="Go to home page"
              >
                Go Home
              </button>
              
              <button 
                onClick={this.handleReport} 
                className="btn btn--secondary"
                aria-label="Download error report"
              >
                Report Issue
              </button>
              
              <button 
                onClick={() => window.location.reload()} 
                className="btn btn--outline"
                aria-label="Reload the page"
              >
                Reload Page
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-boundary__details">
                <summary>Error Details (Development Only)</summary>
                <pre className="error-boundary__stack">
                  {this.state.error.stack}
                </pre>
                {this.state.errorInfo?.componentStack && (
                  <pre className="error-boundary__stack">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export const withErrorBoundary = (Component, options = {}) => {
  const {
    fallback,
    name,
    maxRetries = 3,
    onError
  } = options;

  return function WrappedComponent(props) {
    return (
      <ErrorBoundary 
        fallback={fallback} 
        name={name}
        maxRetries={maxRetries}
        onRetry={onError}
      >
        <Component {...props} />
      </ErrorBoundary>
    );
  };
};

// Async error boundary for handling async operations
export class AsyncErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logError('AsyncErrorBoundary', error, { ...errorInfo, type: 'async' });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback ? 
        this.props.fallback({ error: this.state.error, retry: this.handleRetry }) :
        <div>An async error occurred</div>;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;