import { useState, useEffect, useCallback } from 'react';
import * as idb from '../utils/indexedDB';
import api, { ApiError } from '../services/api';

export const usePhotos = () => {
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadPhotos = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const photos = await idb.getAllPhotos();
      setPhotos(photos);
    } catch (err) {
      console.error('Failed to load photos:', err);
      setError('Failed to load photos from local storage');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addPhoto = useCallback(async (photoData) => {
    setError(null);

    try {
      await idb.savePhoto(photoData);

      const photos = await idb.getAllPhotos();
      setPhotos(photos);

      return photoData;
    } catch (err) {
      console.error('Failed to save photo:', err);
      setError('Failed to save photo');
      throw err;
    }
  }, []);

  const deletePhoto = useCallback(async (photoId) => {
    setError(null);

    try {
      await idb.deletePhoto(photoId);

      setPhotos(prev => prev.filter(p => p.id !== photoId));

      try {
        await api.delete(`/api/photos/${photoId}`);
      } catch (apiErr) {
        console.warn('Photo deleted locally but API sync failed:', apiErr);
      }
    } catch (err) {
      console.error('Failed to delete photo:', err);
      setError('Failed to delete photo');
      throw err;
    }
  }, []);

  const syncFromServer = useCallback(async () => {
    setIsSyncing(true);
    setError(null);

    try {
      const response = await api.get('/api/photos');
      const serverPhotos = response.photos || [];

      const localPhotos = await idb.getAllPhotos();
      const localIds = new Set(localPhotos.map(p => p.id));

      const newPhotos = serverPhotos.filter(p => !localIds.has(p.id));
      
      for (const photo of newPhotos) {
        await idb.savePhoto(photo);
      }

      const updatedPhotos = await idb.getAllPhotos();
      setPhotos(updatedPhotos);

      return { added: newPhotos.length };
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Please sign in to sync photos');
      } else {
        console.error('Sync failed:', err);
        setError('Failed to sync photos from server');
      }
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const updatePhotoMetadata = useCallback(async (photoId, metadata) => {
    setError(null);

    try {
      await idb.updatePhoto(photoId, metadata);

      setPhotos(prev =>
        prev.map(p =>
          p.id === photoId ? { ...p, ...metadata } : p
        )
      );

      try {
        await api.put(`/api/photos/${photoId}`, metadata);
      } catch (apiErr) {
        console.warn('Metadata updated locally but API sync failed:', apiErr);
      }
    } catch (err) {
      console.error('Failed to update photo metadata:', err);
      setError('Failed to update photo metadata');
      throw err;
    }
  }, []);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  return {
    photos,
    isLoading,
    isSyncing,
    error,
    loadPhotos,
    addPhoto,
    deletePhoto,
    syncFromServer,
    updatePhotoMetadata,
    clearError: () => setError(null),
  };
};

export default usePhotos;