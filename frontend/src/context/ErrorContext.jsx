import { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import { handleError, logError, ErrorCodes } from '../utils/errorHandler';

const initialState = {
  errors: [],
  lastError: null,
};

const ActionTypes = {
  ADD_ERROR: 'ADD_ERROR',
  REMOVE_ERROR: 'REMOVE_ERROR',
  CLEAR_ERRORS: 'CLEAR_ERRORS',
};

function errorReducer(state, action) {
  switch (action.type) {
    case ActionTypes.ADD_ERROR:
      return {
        ...state,
        errors: [...state.errors, action.payload],
        lastError: action.payload,
      };
    case ActionTypes.REMOVE_ERROR:
      return {
        ...state,
        errors: state.errors.filter((e) => e.id !== action.payload),
      };
    case ActionTypes.CLEAR_ERRORS:
      return { ...state, errors: [], lastError: null };
    default:
      return state;
  }
}

const ErrorContext = createContext(null);

let errorIdCounter = 0;

export function ErrorProvider({ children }) {
  const [state, dispatch] = useReducer(errorReducer, initialState);

  const addError = useCallback((error, context = {}) => {
    const appError = error instanceof Error ? handleError(error, error.message) : error;
    
    if (!appError.id) {
      appError.id = `error-${++errorIdCounter}`;
    }

    logError(context.component || 'ErrorContext', appError, context);

    dispatch({
      type: ActionTypes.ADD_ERROR,
      payload: appError,
    });

    return appError;
  }, []);

  const removeError = useCallback((errorId) => {
    dispatch({ type: ActionTypes.REMOVE_ERROR, payload: errorId });
  }, []);

  const clearErrors = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_ERRORS });
  }, []);

  const value = useMemo(() => ({
    errors: state.errors,
    lastError: state.lastError,
    addError,
    removeError,
    clearErrors,
    hasErrors: state.errors.length > 0,
    errorCount: state.errors.length,
  }), [state.errors, state.lastError, addError, removeError, clearErrors]);

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
}

export function useErrorContext() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrorContext must be used within an ErrorProvider');
  }
  return context;
}

export { ErrorContext, ActionTypes };
export default ErrorContext;