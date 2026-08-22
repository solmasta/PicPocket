import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ErrorProvider, useErrorContext } from '../src/context/ErrorContext';
import ErrorBoundary from '../src/components/ErrorBoundary/ErrorBoundary';

const TestComponent = ({ onError }) => {
  const { handleError, clearError, error, dismissError } = useErrorContext();

  return (
    <div>
      <button onClick={() => handleError(new Error('Test error'), 'test')}>
        Trigger Error
      </button>
      <button onClick={clearError}>Clear Error</button>
      <button onClick={dismissError}>Dismiss Error</button>
      {error && <div data-testid="error-message">{error.message}</div>}
    </div>
  );
};

describe('ErrorContext', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('handleError', () => {
    it('should set error state with message and context', () => {
      render(
        <ErrorProvider>
          <TestComponent />
        </ErrorProvider>
      );

      fireEvent.click(screen.getByText('Trigger Error'));

      expect(screen.getByTestId('error-message').textContent).toBe('Test error');
    });

    it('should include error code when provided', () => {
      const TestWithCode = () => {
        const { handleError, error } = useErrorContext();
        return (
          <div>
            <button onClick={() => handleError({ message: 'Error', code: 'TEST_CODE' }, 'test')}>
              Trigger
            </button>
            {error && <span data-testid="error-code">{error.code}</span>}
          </div>
        );
      };

      render(
        <ErrorProvider>
          <TestWithCode />
        </ErrorProvider>
      );

      fireEvent.click(screen.getByText('Trigger'));
      expect(screen.getByTestId('error-code').textContent).toBe('TEST_CODE');
    });
  });

  describe('clearError', () => {
    it('should clear error state', () => {
      render(
        <ErrorProvider>
          <TestComponent />
        </ErrorProvider>
      );

      fireEvent.click(screen.getByText('Trigger Error'));
      expect(screen.getByTestId('error-message')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Clear Error'));
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });
  });

  describe('dismissError', () => {
    it('should dismiss error same as clear', () => {
      render(
        <ErrorProvider>
          <TestComponent />
        </ErrorProvider>
      );

      fireEvent.click(screen.getByText('Trigger Error'));
      expect(screen.getByTestId('error-message')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Dismiss Error'));
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });
  });

  describe('error severity', () => {
    it('should log server errors to console', () => {
      const TestWithServerError = () => {
        const { handleError, error } = useErrorContext();
        return (
          <div>
            <button onClick={() => handleError({ message: 'Server error', status: 500 }, 'test')}>
              Trigger Server Error
            </button>
            {error && <div data-testid="error-message">{error.message}</div>}
          </div>
        );
      };

      render(
        <ErrorProvider>
          <TestWithServerError />
        </ErrorProvider>
      );

      fireEvent.click(screen.getByText('Trigger Server Error'));

      expect(console.error).toHaveBeenCalled();
    });
  });
});

describe('ErrorBoundary', () => {
  it('should catch React errors and show fallback', () => {
    const ErrorComponent = () => {
      throw new Error('Render error');
    };

    const Fallback = ({ error }) => (
      <div data-testid="fallback">{error.message}</div>
    );

    render(
      <ErrorBoundary fallback={Fallback}>
        <ErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('fallback').textContent).toBe('Render error');
  });

  it('should call onRetry when retry button clicked', () => {
    const onRetry = vi.fn();

    const ErrorComponent = () => {
      throw new Error('Render error');
    };

    render(
      <ErrorBoundary onRetry={onRetry}>
        <ErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Try Again')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Try Again'));
    expect(onRetry).toHaveBeenCalled();
  });
});