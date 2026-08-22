import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { withErrorHandling, handleError, ErrorCodes } from '../utils/errorHandler';

const STORAGE_KEY = 'picpocket_storage_state';

const initialState = {
  connectedServices: [],
  storageQuota: null,
  usedStorage: 0,
  loading: false,
  error: null,
  lastSync: null
};

const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  ADD_SERVICE: 'ADD_SERVICE',
  REMOVE_SERVICE: 'REMOVE_SERVICE',
  UPDATE_STORAGE: 'UPDATE_STORAGE',
  SET_QUOTA: 'SET_QUOTA',
  SET_LAST_SYNC: 'SET_LAST_SYNC',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

function storageReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    case ActionTypes.ADD_SERVICE:
      if (state.connectedServices.includes(action.payload)) {
        return state;
      }
      return {
        ...state,
        connectedServices: [...state.connectedServices, action.payload]
      };
    case ActionTypes.REMOVE_SERVICE:
      return {
        ...state,
        connectedServices: state.connectedServices.filter(s => s !== action.payload)
      };
    case ActionTypes.UPDATE_STORAGE:
      return { ...state, usedStorage: action.payload };
    case ActionTypes.SET_QUOTA:
      return { ...state, storageQuota: action.payload };
    case ActionTypes.SET_LAST_SYNC:
      return { ...state, lastSync: action.payload };
    case ActionTypes.CLEAR_ERROR:
      return { ...state, error: null };
    default:
      return state;
  }
}

const StorageContext = createContext(null);

export function StorageProvider({ children }) {
  const [state, dispatch] = useReducer(storageReducer, initialState);

  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.connectedServices) {
          parsed.connectedServices.forEach(service => {
            dispatch({ type: ActionTypes.ADD_SERVICE, payload: service });
          });
        }
      } catch (e) {
        console.warn('Failed to restore storage state:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      connectedServices: state.connectedServices,
      storageQuota: state.storageQuota,
      lastSync: state.lastSync
    }));
  }, [state.connectedServices, state.storageQuota, state.lastSync]);

  const setLoading = useCallback((loading) => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: loading });
  }, []);

  const setError = useCallback((error) => {
    dispatch({ type: ActionTypes.SET_ERROR, payload: error });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_ERROR });
  }, []);

  const connectService = useCallback(async (service) => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });
    try {
      dispatch({ type: ActionTypes.ADD_SERVICE, payload: service });
      dispatch({ type: ActionTypes.SET_LAST_SYNC, payload: new Date().toISOString() });
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: handleError(error, 'Failed to connect service') });
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    }
  }, []);

  const disconnectService = useCallback((service) => {
    dispatch({ type: ActionTypes.REMOVE_SERVICE, payload: service });
  }, []);

  const updateStorageUsage = useCallback((usage) => {
    dispatch({ type: ActionTypes.UPDATE_STORAGE, payload: usage });
  }, []);

  const setQuota = useCallback((quota) => {
    dispatch({ type: ActionTypes.SET_QUOTA, payload: quota });
  }, []);

  const value = {
    ...state,
    setLoading,
    setError,
    clearError,
    connectService,
    disconnectService,
    updateStorageUsage,
    setQuota
  };

  return (
    <StorageContext.Provider value={value}>
      {children}
    </StorageContext.Provider>
  );
}

export function useStorage() {
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
}

export { StorageContext, ActionTypes };