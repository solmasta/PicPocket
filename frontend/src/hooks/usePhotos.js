import { useState, useEffect, useCallback } from 'react';
import * as indexedDB from '../utils/indexedDB';
import * as photoService from '../services/photoService';

export function usePhotos() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  // Load photos from IndexedDB on initial load
  useEffect(() => {
    const loadLocalPhotos = async () => {
      try {
        setLoading(true);
        const localPhotos = await indexedDB.getAllPhotos();
        setPhotos(localPhotos);
      } catch (err) {
        console.error('Failed to load local photos:', err);
        setError('Failed to load local photos');
      } finally {
        setLoading(false);
      }
    };

    loadLocalPhotos();
  }, []);

  // Fetch photos from server with pagination
  const fetchServerPhotos = useCallback(async (pageNum = 1) => {
    try {
      setLoading(true);
      const response = await photoService.fetchPhotos(pageNum);
      
      if (response.photos) {
        // Save photos to IndexedDB
        for (const photo of response.photos) {
          await indexedDB.savePhoto({ ...photo, syncedToServer: true });
        }
        
        // Update state
        if (pageNum === 1) {
          setPhotos(response.photos);
        } else {
          setPhotos(prev => [...prev, ...response.photos]);
        }
        
        setHasMore(response.photos.length === response.limit);
        setTotal(response.total);
        setPage(pageNum);
      }
    } catch (err) {
      console.error('Failed to fetch server photos:', err);
      setError('Failed to fetch photos from server');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load more photos (pagination)
  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchServerPhotos(page + 1);
    }
  }, [page, hasMore, loading, fetchServerPhotos]);

  // Refresh photos from server
  const refreshPhotos = useCallback(() => {
    fetchServerPhotos(1);
  }, [fetchServerPhotos]);

  // Upload a new photo
  const uploadPhoto = useCallback(async (file, tags = [], location = null) => {
    try {
      // Save to IndexedDB first
      const localPhoto = {
        id: `local_${Date.now()}`,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        uploadDate: new Date().toISOString(),
        tags,
        location,
        cloudBackup: {},
        syncedToServer: false
      };
      
      await indexedDB.savePhoto(localPhoto);
      setPhotos(prev => [localPhoto, ...prev]);
      
      // Upload to server
      const serverPhoto = await photoService.uploadPhoto(file, tags, location);
      
      // Update local photo with server data
      await indexedDB.savePhoto({ ...serverPhoto, syncedToServer: true });
      
      // Update UI
      setPhotos(prev => prev.map(p => 
        p.id === localPhoto.id ? { ...serverPhoto, syncedToServer: true } : p
      ));
      
      return serverPhoto;
    } catch (err) {
      console.error('Failed to upload photo:', err);
      setError('Failed to upload photo');
      throw err;
    }
  }, []);

  // Delete a photo
  const deletePhoto = useCallback(async (photoId) => {
    try {
      // Delete from server if it was synced
      const photo = photos.find(p => p.id === photoId);
      if (photo && photo.syncedToServer) {
        await photoService.deletePhoto(photoId);
      }
      
      // Delete from IndexedDB
      await indexedDB.deletePhoto(photoId);
      
      // Update UI
      setPhotos(prev => prev.filter(p => p.id !== photoId));
    } catch (err) {
      console.error('Failed to delete photo:', err);
      setError('Failed to delete photo');
      throw err;
    }
  }, [photos]);

  // Update photo tags
  const updatePhotoTags = useCallback(async (photoId, tags) => {
    try {
      const photo = photos.find(p => p.id === photoId);
      
      // Update on server if synced
      if (photo && photo.syncedToServer) {
        await photoService.updatePhoto(photoId, { tags });
      }
      
      // Update in IndexedDB
      await indexedDB.savePhoto({ ...photo, tags });
      
      // Update UI
      setPhotos(prev => prev.map(p => 
        p.id === photoId ? { ...p, tags } : p
      ));
    } catch (err) {
      console.error('Failed to update photo tags:', err);
      setError('Failed to update photo tags');
      throw err;
    }
  }, [photos]);

  return {
    photos,
    loading,
    error,
    hasMore,
    total,
    fetchServerPhotos,
    loadMore,
    refreshPhotos,
    uploadPhoto,
    deletePhoto,
    updatePhotoTags
  };
}