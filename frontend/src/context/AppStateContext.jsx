import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { usePhotos } from '../hooks/usePhotos';
import { useStorageConnections } from '../hooks/useStorageConnections';
import { handleError, AppError } from '../utils/errorHandler';

const AppStateContext = createContext(null);

const initialState = {
  isOnline: navigator.onLine,
  isSyncing: false,
  syncProgress: null,
  notifications: [],
  modals: {
    photoViewer: false,
    upload: false,
    settings: false,
    collage: false
  },
  selectedPhotos: [],
  viewMode: 'grid',
  sortBy: 'date',
  sortOrder: 'desc',
  filters: {
    tags: [],
    dateRange: null,
    location: null,
    source: null
  }
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_ONLINE_STATUS':
      return { ...state, isOnline: action.payload };
    case 'SET_SYNCING':
      return { ...state, isSyncing: action.payload };
    case 'SET_SYNC_PROGRESS':
      return { ...state, syncProgress: action.payload };
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [...state.notifications, action.payload] };
    case 'REMOVE_NOTIFICATION':
      return { ...state, notifications: state.notifications.filter(n => n.id !== action.payload) };
    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notifications: [] };
    case 'OPEN_MODAL':
      return { ...state, modals: { ...state.modals, [action.payload]: true } };
    case 'CLOSE_MODAL':
      return { ...state, modals: { ...state.modals, [action.payload]: false } };
    case 'TOGGLE_PHOTO_SELECTION':
      const photoId = action.payload;
      const isSelected = state.selectedPhotos.includes(photoId);
      return {
        ...state,
        selectedPhotos: isSelected
          ? state.selectedPhotos.filter(id => id !== photoId)
          : [...state.selectedPhotos, photoId]
      };
    case 'SELECT_ALL_PHOTOS':
      return { ...state, selectedPhotos: action.payload };
    case 'CLEAR_PHOTO_SELECTION':
      return { ...state, selectedPhotos: [] };
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };
    case 'SET_SORT':
      return { ...state, sortBy: action.payload.sortBy, sortOrder: action.payload.sortOrder };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'CLEAR_FILTERS':
      return { ...state, filters: initialState.filters };
    default:
      return state;
  }
}

export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { user, isAuthenticated, signIn, signOut, refreshToken } = useAuth();
  const { photos, isLoading: photosLoading, error: photosError, loadPhotos, addPhoto, updatePhoto, deletePhoto } = usePhotos();
  const { connections, connectProvider, disconnectProvider, isConnecting } = useStorageConnections();
  const notificationIdRef = useRef(0);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => dispatch({ type: 'SET_ONLINE_STATUS', payload: true });
    const handleOffline = () => dispatch({ type: 'SET_ONLINE_STATUS', payload: false });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Actions
  const addNotification = useCallback((message, type = 'info', duration = 5000) => {
    const id = ++notificationIdRef.current;
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: { id, message, type, timestamp: Date.now() }
    });

    if (duration > 0) {
      setTimeout(() => {
        dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
      }, duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  }, []);

  const openModal = useCallback((modalName) => {
    dispatch({ type: 'OPEN_MODAL', payload: modalName });
  }, []);

  const closeModal = useCallback((modalName) => {
    dispatch({ type: 'CLOSE_MODAL', payload: modalName });
  }, []);

  const togglePhotoSelection = useCallback((photoId) => {
    dispatch({ type: 'TOGGLE_PHOTO_SELECTION', payload: photoId });
  }, []);

  const selectAllPhotos = useCallback((photoIds) => {
    dispatch({ type: 'SELECT_ALL_PHOTOS', payload: photoIds });
  }, []);

  const clearPhotoSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_PHOTO_SELECTION' });
  }, []);

  const setViewMode = useCallback((mode) => {
    dispatch({ type: 'SET_VIEW_MODE', payload: mode });
  }, []);

  const setSort = useCallback((sortBy, sortOrder) => {
    dispatch({ type: 'SET_SORT', payload: { sortBy, sortOrder } });
  }, []);

  const setFilters = useCallback((filters) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, []);

  const clearFilters = useCallback(() => {
    dispatch({ type: 'CLEAR_FILTERS' });
  }, []);

  const value = {
    // State
    ...state,
    // Auth
    user,
    isAuthenticated,
    signIn,
    signOut,
    refreshToken,
    // Photos
    photos,
    isLoading: photosLoading,
    error: handleError(photosError),
    loadPhotos,
    addPhoto,
    updatePhoto,
    deletePhoto,
    // Storage connections
    connections,
    connectProvider,
    disconnectProvider,
    isConnecting,
    // Actions
    addNotification,
    removeNotification,
    openModal,
    closeModal,
    togglePhotoSelection,
    selectAllPhotos,
    clearPhotoSelection,
    setViewMode,
    setSort,
    setFilters,
    clearFilters,
    dispatch
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new AppError('useAppState must be used within AppStateProvider', 'CONTEXT_ERROR', 500);
  }
  return context;
}

export default AppStateContext;