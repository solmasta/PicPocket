import { createContext, useContext, useState, useCallback } from 'react';

const ErrorContext = createContext(null);

export const useErrorContext = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrorContext must be used within ErrorProvider');
  }
  return context;
};

export const ErrorProvider = ({ children }) => {
  const [error, setError] = useState(null);
  const [errorHistory, setErrorHistory] = useState([]);

  const handleError = useCallback((error, context = 'general') => {
    const errorObj = {
      id: Date.now(),
      message: error?.message || 'An unexpected error occurred',
      code: error?.code || 'UNKNOWN_ERROR',
      status: error?.status || 0,
      context,
      timestamp: new Date().toISOString(),
      stack: error?.stack,
    };

    setError(errorObj);
    setErrorHistory(prev => [...prev.slice(-9), errorObj]);

    if (error?.status >= 500 || error?.code === 'NETWORK_ERROR') {
      console.error('[PicPocket Error]', errorObj);
    }

    return errorObj;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearHistory = useCallback(() => {
    setErrorHistory([]);
  }, []);

  const dismissError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <ErrorContext.Provider value={{
      error,
      errorHistory,
      handleError,
      clearError,
      clearHistory,
      dismissError,
    }}>
      {children}
    </ErrorContext.Provider>
  );
};

export default ErrorContext;