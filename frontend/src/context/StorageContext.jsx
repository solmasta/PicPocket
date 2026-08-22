import { createContext, useContext, useReducer, useCallback, useMemo, useEffect } from 'react';
import { withErrorHandling, logError } from '../utils/errorHandler';

const STORAGE_KEY = 'picpocket_storage_state';

const initialState = {
  connectedServices: [],
  storageQuota: null,
  usedStorage: 0,
  loading: false,
  lastSync: null,
};

const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_SERVICES: 'SET_SERVICES',
  ADD_SERVICE: 'ADD_SERVICE',
  REMOVE_SERVICE: 'REMOVE_SERVICE',
  UPDATE_STORAGE: 'UPDATE_STORAGE',
  SET_QUOTA: 'SET_QUOTA',
  SET_LAST_SYNC: 'SET_LAST_SYNC',
};

function storageReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    case ActionTypes.SET_SERVICES:
      return { ...state, connectedServices: action.payload };
    case ActionTypes.ADD_SERVICE:
      if (state.connectedServices.includes(action.payload)) {
        return state;
      }
      return {
        ...state,
        connectedServices: [...state.connectedServices, action.payload],
      };
    case ActionTypes.REMOVE_SERVICE:
      return {
        ...state,
        connectedServices: state.connectedServices.filter((s) => s !== action.payload),
      };
    case ActionTypes.UPDATE_STORAGE:
      return { ...state, usedStorage: action.payload };
    case ActionTypes.SET_QUOTA:
      return { ...state, storageQuota: action.payload };
    case ActionTypes.SET_LAST_SYNC:
      return { ...state, lastSync: action.payload };
    default:
      return state;
  }
}

const StorageContext = createContext(null);

export function StorageProvider({ children }) {
  const [state, dispatch] = useReducer(storageReducer, initialState);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.connectedServices) {
          dispatch({ type: ActionTypes.SET_SERVICES, payload: parsed.connectedServices });
        }
        if (parsed.storageQuota) {
          dispatch({ type: ActionTypes.SET_QUOTA, payload: parsed.storageQuota });
        }
        if (parsed.lastSync) {
          dispatch({ type: ActionTypes.SET_LAST_SYNC, payload: parsed.lastSync });
        }
      }
    } catch (err) {
      logError('StorageContext.restore', err);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          connectedServices: state.connectedServices,
          storageQuota: state.storageQuota,
          lastSync: state.lastSync,
        })
      );
    } catch (err) {
      logError('StorageContext.persist', err);
    }
  }, [state.connectedServices, state.storageQuota, state.lastSync]);

  const setLoading = useCallback((loading) => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: loading });
  }, []);

  const connectService = useCallback(async (service) => {
    dispatch({ type: ActionTypes.ADD_SERVICE, payload: service });
    dispatch({ type: ActionTypes.SET_LAST_SYNC, payload: new Date().toISOString() });
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

  const value = useMemo(
    () => ({
      ...state,
      setLoading,
      connectService,
      disconnectService,
      updateStorageUsage,
      setQuota,
      isServiceConnected: (service) => state.connectedServices.includes(service),
      usagePercentage: state.storageQuota
        ? Math.round((state.usedStorage / state.storageQuota) * 100)
        : null,
    }),
    [state, setLoading, connectService, disconnectService, updateStorageUsage, setQuota]
  );

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

export { StorageContext };
export default StorageContext;