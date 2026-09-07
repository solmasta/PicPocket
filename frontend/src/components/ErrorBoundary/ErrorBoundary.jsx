import { Component } from 'react';
import { logError } from '../../utils/errorHandler';
import './ErrorBoundary.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      maxRetries: props.maxRetries ?? 3
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logError('React ErrorBoundary', error, {
      componentStack: errorInfo?.componentStack,
      errorBoundary: this.props.name || 'ErrorBoundary',
      retryCount: this.state.retryCount,
      userAgent: navigator.userAgent,
      url: window.location.href
    });
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    if (this.state.retryCount >= this.state.maxRetries) return;

    this.setState((previousState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: previousState.retryCount + 1
    }));

    this.props.onRetry?.();
  };

  handleReport = () => {
    const { error, errorInfo, retryCount } = this.state;
    const reportData = {
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      retryCount,
      appVersion: process.env.REACT_APP_VERSION || 'unknown'
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `error-report-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const canRetry = this.state.retryCount < this.state.maxRetries;
    const fallbackProps = {
      error: this.state.error,
      errorInfo: this.state.errorInfo,
      retry: this.handleRetry,
      report: this.handleReport,
      canRetry,
      retryCount: this.state.retryCount
    };

    if (this.props.fallback) {
      const Fallback = this.props.fallback;
      return <Fallback {...fallbackProps} />;
    }

    return (
      <div className="error-boundary" role="alert">
        <div className="error-boundary__content">
          <div className="error-boundary__icon" aria-hidden="true">
            {canRetry ? '⚠️' : '🚨'}
          </div>
          <h1>Oops! Something went wrong</h1>
          <p className="error-boundary__message">
            {this.state.error?.message || 'An unexpected error occurred while rendering this component.'}
          </p>

          {!canRetry && (
            <p className="error-boundary__hint">
              Retry attempts are exhausted. You can reload the page or report the issue.
            </p>
          )}

          <div className="error-boundary__actions" role="group">
            {canRetry && (
              <button onClick={this.handleRetry} className="btn btn--primary">
                Try Again
              </button>
            )}
            <button onClick={this.handleGoHome} className="btn btn--secondary">
              Go Home
            </button>
            <button onClick={this.handleReport} className="btn btn--secondary">
              Report Issue
            </button>
            <button onClick={() => window.location.reload()} className="btn btn--outline">
              Reload Page
            </button>
          </div>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="error-boundary__details">
              <summary>Error Details (Development Only)</summary>
              <pre className="error-boundary__stack">{this.state.error.stack}</pre>
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
}

export const withErrorBoundary = (WrappedComponent, options = {}) => {
  const { fallback, name, maxRetries = 3, onError } = options;

  return function WrappedWithErrorBoundary(props) {
    return (
      <ErrorBoundary
        fallback={fallback}
        name={name}
        maxRetries={maxRetries}
        onRetry={onError}
      >
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
};

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
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const Fallback = this.props.fallback;
        return <Fallback error={this.state.error} retry={this.handleRetry} />;
      }
      return <div>An async error occurred</div>;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
