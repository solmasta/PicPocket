import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  savePhoto,
  getAllPhotos,
  deletePhoto as deletePhotoFromDB,
  getPhotosByTag,
} from '../utils/indexedDB';
import { resizeImage, createThumbnail, getImageDimensions } from '../utils/imageFilters';
import { getCurrentPosition, reverseGeocode } from '../utils/geolocation';

export function usePhotos(user) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load photos from IndexedDB on mount
  useEffect(() => {
    if (!user) {
      setPhotos([]);
      return;
    }

    async function loadPhotos() {
      setLoading(true);
      try {
        const storedPhotos = await getAllPhotos();
        // Filter to current user's photos
        const userPhotos = storedPhotos.filter((p) => p.userId === user.id);
        userPhotos.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
        setPhotos(userPhotos);
      } catch (err) {
        setError(err.message);
        console.error('Failed to load photos:', err);
      } finally {
        setLoading(false);
      }
    }

    loadPhotos();
  }, [user]);

  const addPhoto = useCallback(
    async (file, options = {}) => {
      if (!user) return null;

      setLoading(true);
      setError(null);

      try {
        const { tags = [], locationEnabled = false } = options;

        // Get dimensions
        const dimensions = await getImageDimensions(file);

        // Resize image for storage
        const dataUrl = await resizeImage(file);
        const thumbnail = await createThumbnail(dataUrl);

        // Get location if enabled
        let location = null;
        if (locationEnabled) {
          try {
            const coords = await getCurrentPosition();
            const locationName = await reverseGeocode(coords.lat, coords.lng);
            location = { ...coords, name: locationName };
          } catch {
            console.warn('Could not get location');
          }
        }

        const photo = {
          id: uuidv4(),
          userId: user.id,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          uploadDate: new Date().toISOString(),
          dataUrl,
          thumbnail,
          tags,
          location,
          dimensions,
          filter: 'none',
          isPublic: false,
          cloudBackup: {
            googlePhotos: null,
            googleDrive: null,
          },
        };

        await savePhoto(photo);
        setPhotos((prev) => [photo, ...prev]);
        return photo;
      } catch (err) {
        setError(err.message);
        console.error('Failed to add photo:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const deletePhoto = useCallback(async (photoId) => {
    try {
      await deletePhotoFromDB(photoId);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } catch (err) {
      setError(err.message);
      console.error('Failed to delete photo:', err);
    }
  }, []);

  const updatePhoto = useCallback(async (updatedPhoto) => {
    try {
      await savePhoto(updatedPhoto);
      setPhotos((prev) => prev.map((p) => (p.id === updatedPhoto.id ? updatedPhoto : p)));
    } catch (err) {
      setError(err.message);
      console.error('Failed to update photo:', err);
    }
  }, []);

  const searchByTag = useCallback(
    async (tag) => {
      try {
        const taggedPhotos = await getPhotosByTag(tag);
        return taggedPhotos.filter((p) => p.userId === user?.id);
      } catch (err) {
        console.error('Failed to search by tag:', err);
        return [];
      }
    },
    [user]
  );

  const getMemoryLanePhotos = useCallback(() => {
    const today = new Date();
    const todayMonth = today.getMonth();
    const todayDay = today.getDate();

    return photos.filter((photo) => {
      const uploadDate = new Date(photo.uploadDate);
      return (
        uploadDate.getMonth() === todayMonth &&
        uploadDate.getDate() === todayDay &&
        uploadDate.getFullYear() < today.getFullYear()
      );
    });
  }, [photos]);

  return {
    photos,
    loading,
    error,
    addPhoto,
    deletePhoto,
    updatePhoto,
    searchByTag,
    getMemoryLanePhotos,
  };
}
